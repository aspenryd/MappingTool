using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntegrationMapper.Api.Controllers
{
    [ApiController]
    [Route("api/systems")]
    public class SystemsController : ControllerBase
    {
        private readonly IntegrationMapperContext _context;

        public SystemsController(IntegrationMapperContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<IntegrationSystemDto>>> GetSystems()
        {
            var systems = await _context.IntegrationSystems
                .Select(s => new IntegrationSystemDto
                {
                    Id = s.Id,
                    ExternalId = s.ExternalId,
                    Name = s.Name,
                    Description = s.Description,
                    Category = s.Category
                })
                .ToListAsync();

            return Ok(systems);
        }

        [HttpPost]
        public async Task<ActionResult<IntegrationSystemDto>> CreateSystem([FromBody] CreateSystemDto dto)
        {
            if (dto == null) return BadRequest();

            var system = new IntegrationSystem
            {
                ExternalId = dto.ExternalId,
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category
            };

            _context.IntegrationSystems.Add(system);
            await _context.SaveChangesAsync();

            var resultDto = new IntegrationSystemDto
            {
                Id = system.Id,
                ExternalId = system.ExternalId,
                Name = system.Name,
                Description = system.Description,
                Category = system.Category
            };

            return CreatedAtAction(nameof(GetSystems), new { id = resultDto.Id }, resultDto);
        }
    }
}
