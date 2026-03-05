using Microsoft.AspNetCore.Mvc;
using Portal.Api; // Added from PortalAPI.dll
using Portal.Api.pvt;
using System.Text;

namespace ImproBridge.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HardwareController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        
        // Impro API connection details (Should be moved to appsettings.json)
        private readonly string _portalIp = "127.0.0.1";
        private readonly int _portalPort = 10010;
        private readonly string _sysUser = "sysdba";
        private readonly string _sysPass = "masterkey";

        public HardwareController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("command")]
        public IActionResult ExecuteCommand([FromBody] HardwareCommandRequest request)
        {
            if (!ValidateApiKey()) return Unauthorized(new { success = false, message = "Invalid API Key" });

            PortalAPI api = new PortalAPI("NexusBridge", false, true); //
            
            try
            {
                if (api.connect(_portalIp, _portalPort, 5000)) //
                {
                    // Login with logout tracking enabled (V5 requirement)
                    api.login(_sysUser, Encoding.UTF8.GetBytes(_sysPass), true); //

                    // Assuming request.GateId is the terminal SLA (e.g., "02010103")
                    // And request.Action is "OPEN_DOOR"
                    
                    // Construct and send the iprxmessage
                    // Note: Depending on your specific wrapper version, this might require building the raw XML 
                    // or using a specific iprxmessage method. 
                    string xmlCommand = $@"<iprxmessage fixedadd=""{request.GateId}"" command=""{request.Action}""></iprxmessage>";
                    
                    // Execute raw command wrapper (adapt based on exact PortalAPI.dll version methods)
                    api.sendCommand("1", "iprxmessage", xmlCommand, "", false); 

                    return Ok(new { success = true, message = $"Command {request.Action} sent to {request.GateId}" });
                }
                return StatusCode(503, new { success = false, message = "Could not connect to Access Portal API" });
            }
            catch (Exception ex)
            {
                // In production, log this instead of returning it directly
                return StatusCode(500, new { success = false, message = "Internal hardware error occurred." });
            }
            finally
            {
                // CRITICAL: Prevent session exhaustion
                if (api != null && api.socket != null && api.socket.isConnected())
                {
                    api.disconnect(); // (Or api.logout() depending on wrapper exact mapping)
                }
            }
        }

        [HttpPost("credential")]
        public IActionResult ProcessCredential([FromBody] VisitorCredentialRequest request)
        {
            if (!ValidateApiKey()) return Unauthorized(new { success = false, message = "Invalid API Key" });

            PortalAPI api = new PortalAPI("NexusBridge", false, true);
            
            try
            {
                if (api.connect(_portalIp, _portalPort, 5000))
                {
                    api.login(_sysUser, Encoding.UTF8.GetBytes(_sysPass), true); //

                    // 1. Create the Master (Tagholder)
                    master m = new master();
                    m.id = "0"; // 0 = create new record
                    m.current = "1"; // 1 = Active
                    m.displayName = "Visitor_" + request.CredentialNumber; 
                    
                    // Assign Visitor Profile
                    profile p = new profile();
                    p.id = "41"; // Assuming 41 is the Visitor profile
                    m.profile = p;

                    // Assign Site
                    site s = new site();
                    s.id = "2"; // Assuming 2 is the default site
                    m.site = s;

                    // 2. Create the Tag
                    tag t = new tag();
                    t.id = "0";
                    t.tagCode = request.CredentialNumber; //
                    t.tagCodeUntruncated = request.CredentialNumber; //
                    t.report = "1";
                    t.suspend = "0"; //
                    
                    // Assign Tag Type
                    tagType tt = new tagType();
                    tt.id = request.TagType.ToString(); // E.g., "15" for Any Tag Type
                    t.tagType = tt;

                    // Assign tag to master
                    m.tags = new tag[] { t };

                    // 3. Persist to Portal Database
                    master savedMaster = (master)api.saveOrUpdate(m);

                    return Ok(new { success = true, message = $"Credential saved with Master ID: {savedMaster.id}" });
                }
                
                return StatusCode(503, new { success = false, message = "Could not connect to Access Portal API" });
            }
            catch (Exception ex)
            {
                // Attempt to extract detailed Impro error if available
                string apiDebug = api?.getDebugStream()?.readDebugMessage() ?? "Unknown";
                return StatusCode(500, new { success = false, message = "Error saving credential. Detail: " + apiDebug });
            }
            finally
            {
                if (api != null && api.socket != null && api.socket.isConnected())
                {
                    api.disconnect();
                }
            }
        }

        private bool ValidateApiKey()
        {
            var expectedApiKey = _configuration["ApiKey"];
            return Request.Headers.TryGetValue("x-api-key", out var extractedApiKey) && extractedApiKey == expectedApiKey;
        }
    }

    public class HardwareCommandRequest
    {
        public string GateId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; 
    }

    public class VisitorCredentialRequest
    {
        public string Action { get; set; } = string.Empty; 
        public string CredentialNumber { get; set; } = string.Empty;
        public int TagType { get; set; }
        // Extend properties over time matching schema
    }
}
