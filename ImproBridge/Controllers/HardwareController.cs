using Microsoft.AspNetCore.Mvc;

namespace ImproBridge.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HardwareController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public HardwareController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("command")]
        public IActionResult ExecuteCommand([FromBody] HardwareCommandRequest request)
        {
            // 1. Validate API Key
            var expectedApiKey = _configuration["ApiKey"];
            if (!Request.Headers.TryGetValue("x-api-key", out var extractedApiKey) || extractedApiKey != expectedApiKey)
            {
                return Unauthorized(new { success = false, message = "Invalid API Key" });
            }

            try
            {
                // TODO: Instantiate and call PortalAPI here to authenticate (sysdba)
                // Implement functionality based on Impro documentation
                
                return Ok(new { success = true, message = $"Command {request.Action} executed on gate {request.GateId}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("credential")]
        public IActionResult ProcessCredential([FromBody] VisitorCredentialRequest request)
        {
            var expectedApiKey = _configuration["ApiKey"];
            if (!Request.Headers.TryGetValue("x-api-key", out var extractedApiKey) || extractedApiKey != expectedApiKey)
            {
                return Unauthorized(new { success = false, message = "Invalid API Key" });
            }

            try
            {
                // TODO: Need to map this to PortalAPI generating XML equivalent of `<mastergroup>` and `<master>`
                
                return Ok(new { success = true, message = $"Credential {request.Action} processed for {request.CredentialNumber}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
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
