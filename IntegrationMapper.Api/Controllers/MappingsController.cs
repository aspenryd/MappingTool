using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Interfaces;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntegrationMapper.Api.Controllers
{
    [ApiController]
    [Route("api/projects")]
    public class MappingsController : ControllerBase
    {
        private readonly IntegrationMapperContext _context;

        public MappingsController(IntegrationMapperContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<MappingProjectDto>>> GetProjects()
        {
            var projects = await _context.MappingProjects.ToListAsync();
            return Ok(projects.Select(p => new MappingProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                SourceObjectId = p.SourceObjectId,
                TargetObjectId = p.TargetObjectId,
                CreatedDate = p.CreatedDate.ToString("O")
            }));
        }

        [HttpPost]
        public async Task<ActionResult<MappingProjectDto>> CreateProject([FromBody] CreateMappingProjectDto dto)
        {
            var project = new MappingProject
            {
                Name = dto.Name,
                SourceObjectId = dto.SourceObjectId,
                TargetObjectId = dto.TargetObjectId,
                CreatedDate = DateTime.UtcNow
            };

            _context.MappingProjects.Add(project);
            await _context.SaveChangesAsync();

            return Ok(new MappingProjectDto
            {
                Id = project.Id,
                Name = project.Name,
                SourceObjectId = project.SourceObjectId,
                TargetObjectId = project.TargetObjectId,
                CreatedDate = project.CreatedDate.ToString("O")
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MappingProjectDto>> GetProject(int id)
        {
            var project = await _context.MappingProjects.FindAsync(id);
            if (project == null) return NotFound();

            return Ok(new MappingProjectDto
            {
                Id = project.Id,
                Name = project.Name,
                SourceObjectId = project.SourceObjectId,
                TargetObjectId = project.TargetObjectId,
                CreatedDate = project.CreatedDate.ToString("O")
            });
        }

        [HttpGet("{projectId}/map")]
        public async Task<ActionResult<MappingContextDto>> GetMappingContext(int projectId)
        {
            var project = await _context.MappingProjects
                .Include(p => p.Mappings)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null) return NotFound("Project not found");

            var sourceHeader = await _context.DataObjects
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.Id == project.SourceObjectId);

            var targetHeader = await _context.DataObjects
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.Id == project.TargetObjectId);

            if (sourceHeader == null || targetHeader == null) return NotFound("Source or Target object not found");

            // Simple mapper for FieldDefinition -> DTO (flat list for now, or we can reconstruct hierarchy)
            // React Flow typically works well with flat lists and 'parentNode' for nested visual grouping, 
            // or just flat list if we use columns.
            // Our existing DTO structure has 'Children'. Let's populate it recursively.
            
            var sourceFields = BuildFieldTree(sourceHeader.Fields.Where(f => f.ParentFieldId == null).ToList(), sourceHeader.Fields);
            var targetFields = BuildFieldTree(targetHeader.Fields.Where(f => f.ParentFieldId == null).ToList(), targetHeader.Fields);

            return Ok(new MappingContextDto
            {
                ProjectId = projectId,
                SourceFields = sourceFields,
                TargetFields = targetFields,
                ExistingMappings = project.Mappings.Select(m => new FieldMappingDto
                {
                    SourceFieldId = m.SourceFieldId,
                    TargetFieldId = m.TargetFieldId,
                    TransformationLogic = m.TransformationLogic
                }).ToList()
            });
        }

        [HttpPost("{projectId}/map")]
        public async Task<IActionResult> SaveMapping(int projectId, [FromBody] FieldMappingDto mappingDto)
        {
            if (mappingDto == null) return BadRequest();

            // Check if mapping exists
            var existing = await _context.FieldMappings
                .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.TargetFieldId == mappingDto.TargetFieldId);

            if (existing != null)
            {
                // Update
                existing.SourceFieldId = mappingDto.SourceFieldId;
                existing.TransformationLogic = mappingDto.TransformationLogic;
            }
            else
            {
                // Create
                var mapping = new FieldMapping
                {
                    ProjectId = projectId,
                    SourceFieldId = mappingDto.SourceFieldId,
                    TargetFieldId = mappingDto.TargetFieldId,
                    TransformationLogic = mappingDto.TransformationLogic
                };
                _context.FieldMappings.Add(mapping);
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("{projectId}/suggest")]
        public async Task<ActionResult<List<FieldMappingSuggestionDto>>> SuggestMappings(int projectId, [FromServices] IAiMappingService aiService)
        {
             var project = await _context.MappingProjects.FindAsync(projectId);
             if (project == null) return NotFound("Project not found");

             var sourceHeader = await _context.DataObjects
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.Id == project.SourceObjectId);

            var targetHeader = await _context.DataObjects
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.Id == project.TargetObjectId);

            if (sourceHeader == null || targetHeader == null) return NotFound("Source or Target object not found");

            // We need to pass the FULL list (or tree) to the service. 
            // The service implementation expects lists.
            // As per implementation, let's pass all fields. The Service handles flattening if needed, 
            // BUT our Service implementation actually DOES flatten. 
            // So we can pass the flat list directly if we wanted, or just pass the root and let it traverse (which it does).
            // Actually, `DataObjects.Fields` is a flat list in EF Core usually unless we filter.
            // But wait, `Exclude ParentFieldId != null`?
            // `Include(d => d.Fields)` loads all fields associated with the DataObject.
            // AND since valid fields have DataObjectId set, they are all in the collection.
            // `FieldDefinition` has a navigation property `Children`. EF Core "fixup" populates this automatically if all entities are tracked.
            // So we can just pass `sourceHeader.Fields.ToList()` which contains ALL fields. 
            // The service `FlattenFields` method takes a list. 
            // Warning: If we pass the flat list of all fields to `FlattenFields`, and that method recursively traverses `Children`, we might process them twice?
            // Let's check the service.
            // Service: `foreach (var field in fields) ... if (field.Children...) FlattenFields(Children)`
            // If `fields` contains children already, we will double count.
            // FIX: We should only pass the ROOT fields to `SuggestMappingsAsync`.

            var sourceRoots = sourceHeader.Fields.Where(f => f.ParentFieldId == null).ToList();
            var targetRoots = targetHeader.Fields.Where(f => f.ParentFieldId == null).ToList();

            // We need to map to DTOs first because the service uses DTOs.
            var sourceDtos = BuildFieldTree(sourceRoots, sourceHeader.Fields);
            var targetDtos = BuildFieldTree(targetRoots, targetHeader.Fields);

            var suggestions = await aiService.SuggestMappingsAsync(sourceDtos, targetDtos);
            return Ok(suggestions);
        }

        // Helper to build tree from flat list
        private List<FieldDefinitionDto> BuildFieldTree(List<FieldDefinition> rootFields, ICollection<FieldDefinition> allFields)
        {
            var list = new List<FieldDefinitionDto>();
            foreach (var field in rootFields)
            {
                var dto = new FieldDefinitionDto
                {
                    Id = field.Id,
                    Name = field.Name,
                    Path = field.Path,
                    DataType = field.DataType,
                    Children = BuildFieldTree(allFields.Where(f => f.ParentFieldId == field.Id).ToList(), allFields)
                };
                list.Add(dto);
            }
            return list;
        }
    }
}
