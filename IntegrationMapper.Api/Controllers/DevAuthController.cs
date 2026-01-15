using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace IntegrationMapper.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class DevAuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;

        public DevAuthController(IConfiguration configuration, IWebHostEnvironment env)
        {
            _configuration = configuration;
            _env = env;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromQuery] string role = "User")
        {
            if (!_env.IsDevelopment())
            {
                return NotFound();
            }

            var secretKey = _configuration["DevAuth:Secret"];
            if (string.IsNullOrEmpty(secretKey))
            {
                return BadRequest("DevAuth:Secret is not configured.");
            }

            // Validate and normalize role
            var normalizedRole = role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "User";
            var userName = normalizedRole == "Admin" ? "Dev Admin" : "Dev User";

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, userName),
                new Claim(ClaimTypes.Role, normalizedRole),
                new Claim("tid", "dev-tenant"),
                new Claim("oid", "dev-user-id")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "integration-mapper-dev",
                audience: "integration-mapper-dev",
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds
            );

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expires = token.ValidTo,
                role = normalizedRole,
                user = userName
            });
        }
    }
}
