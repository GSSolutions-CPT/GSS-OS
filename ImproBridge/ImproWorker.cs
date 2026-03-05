using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Supabase;
using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Polly;
using Portal.Api;
using Portal.Api.pvt;
using Newtonsoft.Json.Linq;

namespace ImproBridge
{
    public class HardwareQueueModel : Postgrest.Models.BaseModel
    {
        [Postgrest.Attributes.PrimaryKey("id", false)]
        public string Id { get; set; }

        [Postgrest.Attributes.Column("status")]
        public string Status { get; set; }
    }

    public class ImproWorker : BackgroundService
    {
        private readonly ILogger<ImproWorker> _logger;
        private readonly IConfiguration _configuration;
        private readonly Supabase.Client _supabase;
        
        // Impro bridge details from config
        private readonly string _portalIp;
        private readonly int _portalPort;
        private readonly string _sysUser;
        private readonly string _sysPass;
        private readonly string _timeProfileId;

        public ImproWorker(ILogger<ImproWorker> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;

            _portalIp = _configuration["Impro:IpAddress"] ?? "127.0.0.1";
            _portalPort = _configuration.GetValue<int>("Impro:Port", 8080);
            _sysUser = _configuration["Impro:Username"] ?? "sysdba";
            _sysPass = _configuration["Impro:Password"] ?? "masterkey";
            _timeProfileId = _configuration["Impro:TimeProfileId"] ?? "41";

            var url = _configuration["Supabase:Url"] ?? throw new ArgumentNullException("Supabase:Url missing");
            var key = _configuration["Supabase:ServiceRoleKey"] ?? throw new ArgumentNullException("Supabase:ServiceRoleKey missing");

            var options = new Supabase.SupabaseOptions {
                AutoConnectRealtime = true
            };
            
            _supabase = new Supabase.Client(url, key, options);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ImproWorker starting.");

            // Initialize Supabase Client
            await _supabase.InitializeAsync();

            // Subscribe to new rows in the hardware_queue table
            var channel = _supabase.Realtime.Channel("public:hardware_queue");
            channel.AddPostgresChangeHandler(
                Supabase.Realtime.PostgresChanges.PostgresChangesOptions.ListenType.Inserts,
                async (sender, args) =>
                {
                    try 
                    {
                        var model = args.Model<HardwareQueueModel>();
                        var record = JObject.FromObject(model);
                        
                        
                        string actionType = record?["action_type"]?.ToString() ?? "UNKNOWN";
                        
                        _logger.LogInformation($"Received command: {actionType}");

                        // Route to hardware logic
                        await ProcessHardwareCommand(record);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing Postgres change");
                    }
                }
            );

            await channel.Subscribe();

            // Keep the worker alive
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(1000, stoppingToken);
            }
        }

        private async Task ProcessHardwareCommand(dynamic record)
        {
            string id = record["id"].ToString();
            string actionType = record["action_type"].ToString();
            var payload = record["payload"] as JObject;
            
            var retryPolicy = Policy
                .Handle<Exception>()
                .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(2), 
                (exception, timeSpan, retryCount, context) =>
                {
                    _logger.LogWarning($"PortalAPI connection/execution failed. Retrying ({retryCount}/3)... {exception.Message}");
                });

            try 
            {
                await retryPolicy.ExecuteAsync(async () =>
                {
                    PortalAPI api = new PortalAPI("NexusBridge", false, true);
                    try
                    {
                        if (!api.connect(_portalIp, _portalPort, 5000))
                        {
                            throw new Exception("PortalAPI connect returned false.");
                        }

                        api.login(_sysUser, Encoding.UTF8.GetBytes(_sysPass));

                        if (actionType == "OPEN_DOOR" && payload != null)
                        {
                            string gateId = payload["gate_id"]?.ToString();
                            string action = payload["action"]?.ToString() ?? "OPEN_DOOR";
                            if (!string.IsNullOrEmpty(gateId))
                            {
                                string xmlCommand = $@"<iprxmessage fixedadd=""{gateId}"" command=""{action}""></iprxmessage>";
                                api.sendCommand("1", "iprxmessage", xmlCommand, "", false);
                                _logger.LogInformation($"Executed {action} on Gate {gateId}");
                            }
                        }
                        else if (actionType == "ADD_CREDENTIAL" && payload != null)
                        {
                            string credNumber = payload["credential_number"]?.ToString();
                            int tagType = payload["tag_type"]?.Value<int>() ?? 15;

                            if (!string.IsNullOrEmpty(credNumber))
                            {
                                master m = new master();
                                m.id = "0"; 
                                m.current = "1"; 
                                m.displayName = "Visitor_" + credNumber; 

                                profile p = new profile();
                                p.id = _timeProfileId; // Assumes Time Profile ID configuration sets the profile appropriately
                                m.profile = p;

                                site s = new site();
                                s.id = "2"; 
                                m.site = s;

                                tag t = new tag();
                                t.id = "0";
                                t.tagCode = credNumber;
                                t.tagCodeUntruncated = credNumber;
                                t.report = "1";
                                t.suspend = "0";
                                
                                tagType tt = new tagType();
                                tt.id = tagType.ToString();
                                t.tagType = tt;

                                m.tag = new tag[] { t };

                                master savedMaster = (master)api.saveOrUpdate(m);
                                _logger.LogInformation($"Saved credential Master ID: {savedMaster?.id}");
                            }
                        }
                    }
                    finally
                    {
                        if (api != null && api.socket != null && api.socket.isConnected())
                        {
                            api.disconnect();
                        }
                    }
                });
                
                // If successful, update Supabase status to 'completed'
                await _supabase.From<HardwareQueueModel>()
                    .Where(x => x.Id == id)
                    .Set(x => x.Status, "completed")
                    .Update();
            }
            catch (System.Exception ex)
            {
                 _logger.LogError(ex, "Hardware failure after retries");
                 
                 // Mark as failed
                 await _supabase.From<HardwareQueueModel>()
                    .Where(x => x.Id == id)
                    .Set(x => x.Status, "failed")
                    .Update();
            }
        }
    }
}
