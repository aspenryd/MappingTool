using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Interfaces;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;

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
            var projects = await _context.MappingProjects
                .Include(p => p.Profiles)
                .ToListAsync();

            return Ok(projects.Select(p => new MappingProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                CreatedDate = p.CreatedDate.ToString("O"),
                Profiles = p.Profiles.Select(prof => new MappingProfileDto
                {
                    Id = prof.Id,
                    Name = prof.Name,
                    SourceObjectId = prof.SourceObjectId,
                    TargetObjectId = prof.TargetObjectId
                }).ToList()
            }));
        }

        [HttpPost]
        public async Task<ActionResult<MappingProjectDto>> CreateProject([FromBody] CreateMappingProjectDto dto)
        {
            var project = new MappingProject
            {
                Name = dto.Name,
                Description = dto.Description,
                CreatedDate = DateTime.UtcNow
            };

            _context.MappingProjects.Add(project);
            await _context.SaveChangesAsync();

            return Ok(new MappingProjectDto
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                CreatedDate = project.CreatedDate.ToString("O")
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MappingProjectDto>> GetProject(int id)
        {
            var project = await _context.MappingProjects
                .Include(p => p.Profiles)
                    .ThenInclude(prof => prof.SourceObject)
                .Include(p => p.Profiles)
                    .ThenInclude(prof => prof.TargetObject)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null) return NotFound();

            return Ok(new MappingProjectDto
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                CreatedDate = project.CreatedDate.ToString("O"),
                Profiles = project.Profiles.Select(prof => new MappingProfileDto
                {
                    Id = prof.Id,
                    Name = prof.Name,
                    SourceObjectId = prof.SourceObjectId,
                    SourceObjectName = prof.SourceObject?.Name,
                    TargetObjectId = prof.TargetObjectId,
                    TargetObjectName = prof.TargetObject?.Name
                }).ToList()
            });
        }

        [HttpPost("{id}/profiles")]
        public async Task<ActionResult<MappingProfileDto>> CreateProfile(int id, [FromBody] CreateMappingProfileDto dto)
        {
            var project = await _context.MappingProjects.FindAsync(id);
            if (project == null) return NotFound("Project not found");

            var profile = new MappingProfile
            {
                MappingProjectId = id,
                Name = dto.Name,
                SourceObjectId = dto.SourceObjectId,
                TargetObjectId = dto.TargetObjectId
            };

            _context.MappingProfiles.Add(profile);
            await _context.SaveChangesAsync();
            
            // Reload to get Object names if needed, or just return basic
            return Ok(new MappingProfileDto
            {
                Id = profile.Id,
                Name = profile.Name,
                SourceObjectId = profile.SourceObjectId,
                TargetObjectId = profile.TargetObjectId
            });
        }

        [HttpGet("/api/profiles/{profileId}/map")]
        public async Task<ActionResult<MappingContextDto>> GetMappingContext(int profileId)
        {
            var profile = await _context.MappingProfiles
                .Include(p => p.Mappings)
                .FirstOrDefaultAsync(p => p.Id == profileId);

            if (profile == null) return NotFound("Profile not found");

            var sourceHeader = await _context.DataObjects
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.Id == profile.SourceObjectId);

            var targetHeader = await _context.DataObjects
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.Id == profile.TargetObjectId);

            if (sourceHeader == null || targetHeader == null) return NotFound("Source or Target object not found");
            
            var sourceFields = BuildFieldTree(sourceHeader.Fields.Where(f => f.ParentFieldId == null).ToList(), sourceHeader.Fields);
            var targetFields = BuildFieldTree(targetHeader.Fields.Where(f => f.ParentFieldId == null).ToList(), targetHeader.Fields);

            return Ok(new MappingContextDto
            {
                ProjectId = profile.MappingProjectId,
                ProfileId = profile.Id,
                SourceFields = sourceFields,
                TargetFields = targetFields,
                ExistingMappings = profile.Mappings.Select(m => new FieldMappingDto
                {
                    SourceFieldId = m.SourceFieldId,
                    TargetFieldId = m.TargetFieldId,
                    TransformationLogic = m.TransformationLogic
                }).ToList()
            });
        }

        [HttpPost("/api/profiles/{profileId}/map")]
        public async Task<IActionResult> SaveMapping(int profileId, [FromBody] FieldMappingDto mappingDto)
        {
            if (mappingDto == null) return BadRequest();

            var existing = await _context.FieldMappings
                .FirstOrDefaultAsync(m => m.ProfileId == profileId && m.TargetFieldId == mappingDto.TargetFieldId);

            if (existing != null)
            {
                existing.SourceFieldId = mappingDto.SourceFieldId;
                existing.TransformationLogic = mappingDto.TransformationLogic;
            }
            else
            {
                var mapping = new FieldMapping
                {
                    ProfileId = profileId,
                    SourceFieldId = mappingDto.SourceFieldId,
                    TargetFieldId = mappingDto.TargetFieldId,
                    TransformationLogic = mappingDto.TransformationLogic
                };
                _context.FieldMappings.Add(mapping);
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("/api/profiles/{profileId}/map/{targetFieldId}")]
        public async Task<IActionResult> DeleteMapping(int profileId, int targetFieldId)
        {
            var mapping = await _context.FieldMappings
                .FirstOrDefaultAsync(m => m.ProfileId == profileId && m.TargetFieldId == targetFieldId);

            if (mapping == null) return NotFound();

            _context.FieldMappings.Remove(mapping);
            await _context.SaveChangesAsync();

            return NoContent();
        }

         [HttpPost("/api/profiles/{profileId}/suggest")]
        public async Task<ActionResult<List<FieldMappingSuggestionDto>>> SuggestMappings(int profileId, [FromServices] IAiMappingService aiService)
        {
             var profile = await _context.MappingProfiles
                 .Include(p => p.Mappings)
                 .FirstOrDefaultAsync(p => p.Id == profileId);

             if (profile == null) return NotFound("Profile not found");

             var sourceHeader = await _context.DataObjects
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.Id == profile.SourceObjectId);

            var targetHeader = await _context.DataObjects
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.Id == profile.TargetObjectId);

            if (sourceHeader == null || targetHeader == null) return NotFound("Source or Target object not found");

            var sourceRoots = sourceHeader.Fields.Where(f => f.ParentFieldId == null).ToList();
            var targetRoots = targetHeader.Fields.Where(f => f.ParentFieldId == null).ToList();

            var sourceDtos = BuildFieldTree(sourceRoots, sourceHeader.Fields);
            var targetDtos = BuildFieldTree(targetRoots, targetHeader.Fields);

            // Get existing target IDs to filter out
            var existingTargetIds = profile.Mappings.Select(m => m.TargetFieldId).ToList();

            var suggestions = await aiService.SuggestMappingsAsync(sourceDtos, targetDtos, existingTargetIds);
            return Ok(suggestions);
        }

        [HttpGet("/api/profiles/{profileId}/export/excel")]
        public async Task<IActionResult> ExportExcel(int profileId)
        {
            var profile = await _context.MappingProfiles
                .Include(p => p.Mappings)
                .Include(p => p.MappingProject)
                .FirstOrDefaultAsync(p => p.Id == profileId);

            if (profile == null) return NotFound();

            var sourceHeader = await _context.DataObjects
                .Include(d => d.System)
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.Id == profile.SourceObjectId);

            var targetHeader = await _context.DataObjects
                .Include(d => d.System)
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.Id == profile.TargetObjectId);

            if (sourceHeader == null || targetHeader == null) return NotFound("Data Objects not found");

            using (var workbook = new XLWorkbook())
            {
                var sheet = workbook.Worksheets.Add("Mapping Specification");
                
                string[] headers = {
                    "Source System", "Source Object", "Source Path", "Source Field", "Source Example",
                    "Target System", "Target Object", "Target Path", "Target Field", "Target Example",
                    "Mapping Comment / Logic"
                };

                for (int i = 0; i < headers.Length; i++)
                {
                    sheet.Cell(1, i + 1).Value = headers[i];
                    sheet.Cell(1, i + 1).Style.Font.Bold = true;
                }

                int row = 2;
                foreach (var targetField in targetHeader.Fields)
                {
                    var mapping = profile.Mappings.FirstOrDefault(m => m.TargetFieldId == targetField.Id);
                    
                    sheet.Cell(row, 6).Value = targetHeader.System.Name;
                    sheet.Cell(row, 7).Value = targetHeader.Name;
                    sheet.Cell(row, 8).Value = targetField.Path;
                    sheet.Cell(row, 9).Value = targetField.Name;
                    sheet.Cell(row, 10).Value = targetField.ExampleValue;

                    if (mapping != null)
                    {
                        sheet.Cell(row, 11).Value = mapping.TransformationLogic;

                        if (mapping.SourceFieldId.HasValue)
                        {
                             var sourceField = sourceHeader.Fields.FirstOrDefault(f => f.Id == mapping.SourceFieldId);
                             if (sourceField != null)
                             {
                                 sheet.Cell(row, 1).Value = sourceHeader.System.Name;
                                 sheet.Cell(row, 2).Value = sourceHeader.Name;
                                 sheet.Cell(row, 3).Value = sourceField.Path;
                                 sheet.Cell(row, 4).Value = sourceField.Name;
                                 sheet.Cell(row, 5).Value = sourceField.ExampleValue;
                             }
                        }
                    }
                    row++;
                }

                sheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var content = stream.ToArray();
                    return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Mapping_{profile.Name}.xlsx");
                }
            }
        }

        [HttpGet("/api/profiles/{profileId}/export/csharp")]
        public async Task<IActionResult> ExportCSharp(int profileId)
        {
            var code = await GenerateCSharpCode(profileId);
            if (code == null) return NotFound();
            var className = "Mapper"; // Simple default or parse from code
            return File(System.Text.Encoding.UTF8.GetBytes(code), "text/plain", $"{className}.cs");
        }

        [HttpGet("/api/profiles/{profileId}/code/csharp")]
        public async Task<ActionResult<string>> GetCSharpCode(int profileId)
        {
            var code = await GenerateCSharpCode(profileId);
            if (code == null) return NotFound();
            return Ok(code);
        }

        private async Task<string> GenerateCSharpCode(int profileId)
        {
            var profile = await _context.MappingProfiles
                .Include(p => p.Mappings)
                .FirstOrDefaultAsync(p => p.Id == profileId);
            
             if (profile == null) return null;

             var targetHeader = await _context.DataObjects.FindAsync(profile.TargetObjectId);
             var sourceHeader = await _context.DataObjects.FindAsync(profile.SourceObjectId);

             var mappings = profile.Mappings.ToList();
             var sb = new System.Text.StringBuilder();

             string Sanitize(string input) => System.Text.RegularExpressions.Regex.Replace(input, @"[^a-zA-Z0-9_]", "");

             var className = Sanitize(profile.Name) + "Mapper";
             var sourceClass = Sanitize(sourceHeader.Name);
             var targetClass = Sanitize(targetHeader.Name);

             sb.AppendLine("using System;");
             sb.AppendLine();
             sb.AppendLine($"public class {className}");
             sb.AppendLine("{");
             sb.AppendLine($"    public {targetClass} Map({sourceClass} source)");
             sb.AppendLine("    {");
             sb.AppendLine($"        var target = new {targetClass}();");
             sb.AppendLine();

             foreach(var m in mappings)
             {
                 var targetField = await _context.FieldDefinitions.FindAsync(m.TargetFieldId);
                 var sourceField = m.SourceFieldId.HasValue ? await _context.FieldDefinitions.FindAsync(m.SourceFieldId) : null;
                 
                 if (targetField != null)
                 {
                     // Improved path logic
                     var targetParts = targetField.Path.Split('.');
                     string targetAccess = "target." + string.Join(".", targetParts.Skip(1).Select(s => Sanitize(s)));

                     // Fallback if path doesn't contain object name correctly
                     if (targetParts.Length == 1) targetAccess = "target." + Sanitize(targetField.Name);

                     if (sourceField != null)
                     {
                         var sourceParts = sourceField.Path.Split('.');
                         string sourceAccess = "source." + string.Join(".", sourceParts.Skip(1).Select(s => Sanitize(s)));
                         if (sourceParts.Length == 1) sourceAccess = "source." + Sanitize(sourceField.Name);

                         sb.AppendLine($"        {targetAccess} = {sourceAccess}; // {m.TransformationLogic}");
                     }
                     else
                     {
                         sb.AppendLine($"        {targetAccess} = null; // {m.TransformationLogic}");
                     }
                 }
             }

             sb.AppendLine();
             sb.AppendLine("        return target;");
             sb.AppendLine("    }");
             sb.AppendLine("}");
             
             return sb.ToString();
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
                    Length = field.Length,
                    ExampleValue = field.ExampleValue,
                    Description = field.Description,
                    Children = BuildFieldTree(allFields.Where(f => f.ParentFieldId == field.Id).ToList(), allFields)
                };
                list.Add(dto);
            }
            return list;
        }
    }
}
