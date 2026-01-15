using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntegrationMapper.Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly IntegrationMapperContext _context;

        public UsersController(IntegrationMapperContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<UserDto>>> GetUsers()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users.Select(u => new UserDto
            {
                Id = u.PublicId,
                Email = u.Email,
                DisplayName = u.DisplayName,
                Role = u.Role.ToString(),
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt
            }).ToList());
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<UserDto>> GetUser(Guid id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.PublicId == id);
            if (user == null) return NotFound();

            return Ok(new UserDto
            {
                Id = user.PublicId,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            });
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto dto)
        {
            // Check for duplicate email
            var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existing != null)
            {
                return BadRequest($"User with email '{dto.Email}' already exists.");
            }

            var role = Enum.TryParse<UserRole>(dto.Role, true, out var parsedRole) 
                ? parsedRole 
                : UserRole.User;

            var user = new User
            {
                Email = dto.Email,
                DisplayName = dto.DisplayName,
                Role = role,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.PublicId }, new UserDto
            {
                Id = user.PublicId,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            });
        }

        [HttpPut("{id:guid}/role")]
        public async Task<ActionResult<UserDto>> UpdateUserRole(Guid id, [FromBody] UpdateUserRoleDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.PublicId == id);
            if (user == null) return NotFound();

            if (!Enum.TryParse<UserRole>(dto.Role, true, out var parsedRole))
            {
                return BadRequest($"Invalid role '{dto.Role}'. Valid roles are: User, Admin");
            }

            user.Role = parsedRole;
            await _context.SaveChangesAsync();

            return Ok(new UserDto
            {
                Id = user.PublicId,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.PublicId == id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
