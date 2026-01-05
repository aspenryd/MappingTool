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
             var systems = await _context.IntegrationSystems.ToListAsync();
             return Ok(systems.Select(s => new IntegrationSystemDto
             {
                 Id = s.PublicId,
                 Name = s.Name,
                 ExternalId = s.ExternalId,
                 Category = s.Category,
                 Description = s.Description
             }).ToList());
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<IntegrationSystemDto>> GetSystem(Guid id)
        {
            var s = await _context.IntegrationSystems.FirstOrDefaultAsync(x => x.PublicId == id);
            if (s == null) return NotFound();

            return Ok(new IntegrationSystemDto
            {
                Id = s.PublicId,
                Name = s.Name,
                ExternalId = s.ExternalId,
                Category = s.Category,
                Description = s.Description
            });
        }

        [HttpPost]
        public async Task<ActionResult<IntegrationSystemDto>> CreateSystem([FromBody] CreateSystemDto dto)
        {
            var system = new IntegrationSystem
            {
                Name = dto.Name,
                ExternalId = dto.ExternalId,
                Description = dto.Description,
                Category = dto.Category
            };

            _context.IntegrationSystems.Add(system);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSystem), new { id = system.PublicId }, new IntegrationSystemDto
            {
                Id = system.PublicId,
                Name = system.Name,
                ExternalId = system.ExternalId,
                Category = system.Category,
                Description = system.Description
            });
        }
    }
}
