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
        private readonly IExampleExtractionService _exampleExtractor;
        private readonly IFileStorageService _fileStorage;

        public MappingsController(IntegrationMapperContext context, IExampleExtractionService exampleExtractor, IFileStorageService fileStorage)
        {
            _context = context;
            _exampleExtractor = exampleExtractor;
            _fileStorage = fileStorage;
        }

        [HttpGet]
        public async Task<ActionResult<List<MappingProjectDto>>> GetProjects()
        {
            var projects = await _context.MappingProjects
                .Include(p => p.SourceSystem)
                .Include(p => p.TargetSystem)
                .Include(p => p.Profiles)
                    .ThenInclude(pr => pr.SourceObject)
                .Include(p => p.Profiles)
                    .ThenInclude(pr => pr.TargetObject)
                .ToListAsync();

            return Ok(projects.Select(p => new MappingProjectDto
            {
                Id = p.PublicId,
                Name = p.Name,
                Description = p.Description,
                SourceSystemId = p.SourceSystem?.PublicId ?? Guid.Empty,
                TargetSystemId = p.TargetSystem?.PublicId ?? Guid.Empty,
                CreatedDate = p.CreatedDate.ToString("O"),
                Profiles = p.Profiles.Select(prof => new MappingProfileDto
                {
                    Id = prof.PublicId,
                    Name = prof.Name,
                    SourceObjectId = prof.SourceObject?.PublicId ?? Guid.Empty,
                    TargetObjectId = prof.TargetObject?.PublicId ?? Guid.Empty,
                    SourceObjectName = prof.SourceObject?.Name,
                    TargetObjectName = prof.TargetObject?.Name
                }).ToList()
            }));
        }

        [HttpPost]
        public async Task<ActionResult<MappingProjectDto>> CreateProject([FromBody] CreateMappingProjectDto dto)
        {
            var sourceSystem = await _context.IntegrationSystems.FirstOrDefaultAsync(s => s.PublicId == dto.SourceSystemPublicId);
            var targetSystem = await _context.IntegrationSystems.FirstOrDefaultAsync(s => s.PublicId == dto.TargetSystemPublicId);

            if (sourceSystem == null || targetSystem == null) return BadRequest("Invalid Source or Target System Public Id");

            var project = new MappingProject
            {
                Name = dto.Name,
                Description = dto.Description,
                SourceSystemId = sourceSystem.Id,
                TargetSystemId = targetSystem.Id,
                CreatedDate = DateTime.UtcNow
            };

            _context.MappingProjects.Add(project);
            await _context.SaveChangesAsync();
            
            // Reload to get properly populated state or construct manually
            return Ok(new MappingProjectDto
            {
                Id = project.PublicId,
                Name = project.Name,
                Description = project.Description,
                SourceSystemId = sourceSystem.PublicId,
                TargetSystemId = targetSystem.PublicId,
                CreatedDate = project.CreatedDate.ToString("O")
            });
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<MappingProjectDto>> GetProject(Guid id)
        {
             var project = await _context.MappingProjects
                .Include(p => p.SourceSystem)
                .Include(p => p.TargetSystem)
                .Include(p => p.Profiles)
                    .ThenInclude(prof => prof.SourceObject)
                .Include(p => p.Profiles)
                    .ThenInclude(prof => prof.TargetObject)
                .FirstOrDefaultAsync(p => p.PublicId == id);

            if (project == null) return NotFound();

            return Ok(new MappingProjectDto
            {
                Id = project.PublicId,
                Name = project.Name,
                Description = project.Description,
                SourceSystemId = project.SourceSystem?.PublicId ?? Guid.Empty,
                TargetSystemId = project.TargetSystem?.PublicId ?? Guid.Empty,
                CreatedDate = project.CreatedDate.ToString("O"),
                Profiles = project.Profiles.Select(prof => new MappingProfileDto
                {
                    Id = prof.PublicId,
                    Name = prof.Name,
                    SourceObjectId = prof.SourceObject?.PublicId ?? Guid.Empty,
                    TargetObjectId = prof.TargetObject?.PublicId ?? Guid.Empty,
                    SourceObjectName = prof.SourceObject?.Name,
                    TargetObjectName = prof.TargetObject?.Name
                }).ToList()
            });
        }
        
        // Removed legacy GetProject(int) and GetProjectByPublicId(Guid) duplication. The above handles "GetProject" via Guid.

        [HttpPost("{id:guid}/profiles")]
        public async Task<ActionResult<MappingProfileDto>> CreateProfile(Guid id, [FromBody] CreateMappingProfileDto dto)
        {
            var project = await _context.MappingProjects.FirstOrDefaultAsync(p => p.PublicId == id);
            if (project == null) return NotFound("Project not found");

            var sourceObj = await _context.DataObjects.FirstOrDefaultAsync(d => d.PublicId == dto.SourceObjectPublicId);
            var targetObj = await _context.DataObjects.FirstOrDefaultAsync(d => d.PublicId == dto.TargetObjectPublicId);

            if (sourceObj == null || targetObj == null) return BadRequest("Source or Target Object not found");

            var profile = new MappingProfile
            {
                MappingProjectId = project.Id,
                Name = dto.Name,
                SourceObjectId = sourceObj.Id,
                TargetObjectId = targetObj.Id
            };

            _context.MappingProfiles.Add(profile);
            await _context.SaveChangesAsync();
            
            return Ok(new MappingProfileDto
            {
                Id = profile.PublicId,
                Name = profile.Name,
                SourceObjectId = sourceObj.PublicId,
                TargetObjectId = targetObj.PublicId,
                SourceObjectName = sourceObj.Name,
                TargetObjectName = targetObj.Name
            });
        }

        // Consolidating GetMappingContext logic to only use PublicId
        [HttpGet("/api/profiles/{publicId:guid}/map")]
        public async Task<ActionResult<MappingContextDto>> GetMappingContext(Guid publicId)
        {
            var profile = await _context.MappingProfiles
                .Include(p => p.MappingProject)
                .Include(p => p.Mappings)
                    .ThenInclude(m => m.Sources)
                .FirstOrDefaultAsync(p => p.PublicId == publicId);

            if (profile == null) return NotFound("Profile not found");

            var sourceHeader = await _context.DataObjects
                .Include(d => d.Fields)
                .Include(d => d.Examples)
                .FirstOrDefaultAsync(d => d.Id == profile.SourceObjectId);

            var targetHeader = await _context.DataObjects
                .Include(d => d.Fields)
                .Include(d => d.Examples)
                .FirstOrDefaultAsync(d => d.Id == profile.TargetObjectId);

            if (sourceHeader == null || targetHeader == null) return NotFound("Source or Target object not found");
            
            var sourceExampleValues = await GetAggregatedExamples(sourceHeader);
            var targetExampleValues = await GetAggregatedExamples(targetHeader);

            var sourceFields = BuildFieldTree(sourceHeader.Fields.Where(f => f.ParentFieldId == null).ToList(), sourceHeader.Fields, sourceExampleValues);
            var targetFields = BuildFieldTree(targetHeader.Fields.Where(f => f.ParentFieldId == null).ToList(), targetHeader.Fields, targetExampleValues);

            return Ok(new MappingContextDto
            {
                ProjectId = profile.MappingProject?.PublicId ?? Guid.Empty,
                ProfileId = profile.PublicId,
                SourceFields = sourceFields,
                TargetFields = targetFields,
                SourceExamples = sourceHeader.Examples.Select(e => new DataObjectExampleDto 
                { 
                    Id = e.PublicId, 
                    FileName = e.FileName, 
                    UploadedAt = e.UploadedAt 
                }).ToList(),
                TargetExamples = targetHeader.Examples.Select(e => new DataObjectExampleDto 
                { 
                    Id = e.PublicId, 
                    FileName = e.FileName, 
                    UploadedAt = e.UploadedAt 
                }).ToList(),
                ExistingMappings = profile.Mappings.Select(m => new FieldMappingDto
                {
                    SourceFieldId = m.SourceFieldId,
                    TargetFieldId = m.TargetFieldId,
                    TransformationLogic = m.TransformationLogic,
                    SourceFieldIds = m.Sources.Any() 
                        ? m.Sources.OrderBy(s => s.OrderIndex).Select(s => s.SourceFieldId).ToList() 
                        : (m.SourceFieldId.HasValue ? new List<int> { m.SourceFieldId.Value } : new List<int>())
                }).ToList()
            });
        }
        // Removed duplicate GetMappingContextByPublicId logic.



        [HttpPost("/api/profiles/{profileId:guid}/map")]
        public async Task<IActionResult> SaveMapping(Guid profileId, [FromBody] FieldMappingDto mappingDto)
        {
            if (mappingDto == null) return BadRequest();

            // Resolve ID
            var profile = await _context.MappingProfiles.FirstOrDefaultAsync(p => p.PublicId == profileId);
            if (profile == null) return NotFound("Profile not found");
            int intProfileId = profile.Id;

            var existing = await _context.FieldMappings
                .Include(m => m.Sources)
                .FirstOrDefaultAsync(m => m.ProfileId == intProfileId && m.TargetFieldId == mappingDto.TargetFieldId);

            if (existing != null)
            {
                existing.TransformationLogic = mappingDto.TransformationLogic;
                
                // Update Sources
                _context.FieldMappingSources.RemoveRange(existing.Sources);
                existing.Sources.Clear();

                if (mappingDto.SourceFieldIds != null && mappingDto.SourceFieldIds.Any())
                {
                     int idx = 0;
                     foreach(var sid in mappingDto.SourceFieldIds)
                     {
                         existing.Sources.Add(new FieldMappingSource { SourceFieldId = sid, OrderIndex = idx++ });
                     }
                     existing.SourceFieldId = mappingDto.SourceFieldIds.First();
                }
                else if (mappingDto.SourceFieldId.HasValue)
                {
                     existing.Sources.Add(new FieldMappingSource { SourceFieldId = mappingDto.SourceFieldId.Value, OrderIndex = 0 });
                     existing.SourceFieldId = mappingDto.SourceFieldId;
                }
                else
                {
                    existing.SourceFieldId = null;
                }
            }
            else
            {
                var mapping = new FieldMapping
                {
                    ProfileId = intProfileId,
                    TargetFieldId = mappingDto.TargetFieldId,
                    TransformationLogic = mappingDto.TransformationLogic
                };

                if (mappingDto.SourceFieldIds != null && mappingDto.SourceFieldIds.Any())
                {
                     int idx = 0;
                     foreach(var sid in mappingDto.SourceFieldIds)
                     {
                         mapping.Sources.Add(new FieldMappingSource { SourceFieldId = sid, OrderIndex = idx++ });
                     }
                     mapping.SourceFieldId = mappingDto.SourceFieldIds.First();
                }
                else if (mappingDto.SourceFieldId.HasValue)
                {
                     mapping.Sources.Add(new FieldMappingSource { SourceFieldId = mappingDto.SourceFieldId.Value, OrderIndex = 0 });
                     mapping.SourceFieldId = mappingDto.SourceFieldId;
                }

                _context.FieldMappings.Add(mapping);
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("/api/profiles/{profileId:guid}/map/{targetFieldId}")]
        public async Task<IActionResult> DeleteMapping(Guid profileId, int targetFieldId)
        {
             var profile = await _context.MappingProfiles.FirstOrDefaultAsync(p => p.PublicId == profileId);
             if (profile == null) return NotFound("Profile not found");
             
            var mapping = await _context.FieldMappings
                .FirstOrDefaultAsync(m => m.ProfileId == profile.Id && m.TargetFieldId == targetFieldId);

            if (mapping == null) return NotFound();

            _context.FieldMappings.Remove(mapping);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("/api/profiles/{profileId}/suggest")]
        public async Task<ActionResult<List<FieldMappingSuggestionDto>>> SuggestMappings(Guid profileId, [FromServices] IAiMappingService aiService)
        {
             var profile = await _context.MappingProfiles
                 .Include(p => p.Mappings)
                 .FirstOrDefaultAsync(p => p.PublicId == profileId);

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

            // Suggestions don't need expensive example parsing, use empty or basic
            var sourceDtos = BuildFieldTree(sourceRoots, sourceHeader.Fields, new Dictionary<string, List<string>>());
            var targetDtos = BuildFieldTree(targetRoots, targetHeader.Fields, new Dictionary<string, List<string>>());

            // Get existing target IDs to filter out
            var existingTargetIds = profile.Mappings.Select(m => m.TargetFieldId).ToList();

            var suggestions = await aiService.SuggestMappingsAsync(sourceDtos, targetDtos, existingTargetIds);
            return Ok(suggestions);
        }

        [HttpGet("/api/profiles/{profileId}/export/excel")]
        public async Task<IActionResult> ExportExcel(Guid profileId)
        {
            var profile = await _context.MappingProfiles
                .Include(p => p.Mappings)
                    .ThenInclude(m => m.Sources) // Include sources
                .Include(p => p.MappingProject)
                .FirstOrDefaultAsync(p => p.PublicId == profileId);

            if (profile == null) return NotFound();

            var targetHeader = await _context.DataObjects
                                        .Include(d => d.System)
                                        .Include(d => d.Fields)
                                        .FirstAsync(d => d.Id == profile.TargetObjectId);

            var sourceHeader = await _context.DataObjects
                                        .Include(d => d.System)
                                        .Include(d => d.Fields)
                                        .FirstAsync(d => d.Id == profile.SourceObjectId);

            if (sourceHeader == null || targetHeader == null) return NotFound("Data Objects not found");

            using (var workbook = new XLWorkbook())
            {
                var sheet = workbook.Worksheets.Add("Mapping Specification");
                
                string[] headers = {
                    "Source System", "Source Object", "Source Path", "Source Field", "Source Example",
                    "Target System", "Target Object", "Target Path", "Target Field", "Target Example", "Target Mandatory",
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
                    sheet.Cell(row, 11).Value = targetField.IsMandatory ? "Yes" : "No";

                    if (mapping != null)
                    {
                        sheet.Cell(row, 12).Value = mapping.TransformationLogic;

                        if (mapping.Sources != null && mapping.Sources.Any())
                        {
                            var sortedSources = mapping.Sources.OrderBy(s => s.OrderIndex).ToList();
                            
                            // Multi-source display: Concatenate values? 
                            // Or leave cells empty if too complex?
                            // Let's concatenate with newline
                            
                            var sourceSystems = new List<string>();
                            var sourceObjects = new List<string>();
                            var sourcePaths = new List<string>();
                            var sourceFields = new List<string>();
                            var sourceExamples = new List<string>();

                            foreach(var src in sortedSources)
                            {
                                var field = sourceHeader.Fields.FirstOrDefault(f => f.Id == src.SourceFieldId);
                                if (field != null)
                                {
                                    sourceSystems.Add(sourceHeader.System.Name);
                                    sourceObjects.Add(sourceHeader.Name);
                                    sourcePaths.Add(field.Path);
                                    sourceFields.Add(field.Name);
                                    sourceExamples.Add(field.ExampleValue);
                                }
                            }

                            if (sortedSources.Count > 1) {
                                sheet.Cell(row, 1).Value = string.Join("\n", sourceSystems.Distinct()); // Dedup system/obj for cleaner look
                                sheet.Cell(row, 2).Value = string.Join("\n", sourceObjects.Distinct());
                                sheet.Cell(row, 3).Value = string.Join("\n", sourcePaths);
                                sheet.Cell(row, 4).Value = string.Join("\n", sourceFields);
                                sheet.Cell(row, 5).Value = string.Join("\n", sourceExamples);
                                
                                // Enable wrap text
                                for(int c=1; c<=5; c++) sheet.Cell(row, c).Style.Alignment.WrapText = true;
                            } 
                            else if (sortedSources.Count == 1)
                            {
                                // Single source - same as before
                                sheet.Cell(row, 1).Value = sourceSystems.FirstOrDefault();
                                sheet.Cell(row, 2).Value = sourceObjects.FirstOrDefault();
                                sheet.Cell(row, 3).Value = sourcePaths.FirstOrDefault();
                                sheet.Cell(row, 4).Value = sourceFields.FirstOrDefault();
                                sheet.Cell(row, 5).Value = sourceExamples.FirstOrDefault();
                            }
                        }
                        else if (mapping.SourceFieldId.HasValue)
                        {
                             // Fallback for legacy
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
        public async Task<IActionResult> ExportCSharp(Guid profileId)
        {
            var code = await GenerateCSharpCode(profileId);
            if (code == null) return NotFound();
            var className = "Mapper"; // Simple default or parse from code
            return File(System.Text.Encoding.UTF8.GetBytes(code), "text/plain", $"{className}.cs");
        }

        [HttpGet("/api/profiles/{profileId}/code/csharp")]
        public async Task<ActionResult<string>> GetCSharpCode(Guid profileId)
        {
            var code = await GenerateCSharpCode(profileId);
            if (code == null) return NotFound();
            return Ok(code);
        }

        private async Task<string> GenerateCSharpCode(Guid profileId)
        {
            var profile = await _context.MappingProfiles
                .Include(p => p.Mappings)
                    .ThenInclude(m => m.Sources)
                .FirstOrDefaultAsync(p => p.PublicId == profileId);
            
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
                 
                 // Get Sources
                 var sourceFields = new List<FieldDefinition>();
                 if (m.Sources != null && m.Sources.Any())
                 {
                     foreach(var s in m.Sources.OrderBy(x => x.OrderIndex))
                     {
                         var field = await _context.FieldDefinitions.FindAsync(s.SourceFieldId);
                         if (field != null) sourceFields.Add(field);
                     }
                 }
                 else if (m.SourceFieldId.HasValue)
                 {
                     var field = await _context.FieldDefinitions.FindAsync(m.SourceFieldId.Value);
                     if (field != null) sourceFields.Add(field);
                 }
                 
                 if (targetField != null)
                 {
                     // Target Access
                     var targetParts = targetField.Path.Split('.');
                     string targetAccess = "target." + string.Join(".", targetParts.Skip(1).Select(s => Sanitize(s)));
                     if (targetParts.Length == 1) targetAccess = "target." + Sanitize(targetField.Name);

                     if (sourceFields.Any())
                     {
                         // Generate source access strings
                         var sourceAccesses = new List<string>();
                         foreach(var sf in sourceFields)
                         {
                             var sourceParts = sf.Path.Split('.');
                             string acc = "source." + string.Join(".", sourceParts.Skip(1).Select(s => Sanitize(s)));
                             if (sourceParts.Length == 1) acc = "source." + Sanitize(sf.Name);
                             sourceAccesses.Add(acc);
                         }

                         var comment = m.TransformationLogic?.Replace("\n", " ") ?? "";
                         
                         if (sourceAccesses.Count == 1)
                         {
                             sb.AppendLine($"        {targetAccess} = {sourceAccesses[0]}; // {comment}");
                         }
                         else
                         {
                             // Multi-source: Assuming string concatenation if string, logic needed for others
                             // Default to comment + placeholder
                             sb.AppendLine($"        // Multi-Mapping: {targetField.Name} <- {string.Join(", ", sourceFields.Select(f => f.Name))}");
                             sb.AppendLine($"        // Logic: {comment}");
                             sb.AppendLine($"        {targetAccess} = $\"{string.Join("", sourceAccesses.Select(s => "{" + s + "}"))}\";");
                         }
                     }
                     else
                     {
                         string comment = m.TransformationLogic ?? "Manual";
                         sb.AppendLine($"        {targetAccess} = null; // {comment}");
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
        private List<FieldDefinitionDto> BuildFieldTree(List<FieldDefinition> rootFields, ICollection<FieldDefinition> allFields, Dictionary<string, List<string>> exampleValues)
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
                    IsArray = field.IsArray,
                    IsMandatory = field.IsMandatory,
                    SchemaAttributes = field.SchemaAttributes,
                    ExampleValue = field.ExampleValue,
                    Description = field.Description,
                    Children = BuildFieldTree(allFields.Where(f => f.ParentFieldId == field.Id).ToList(), allFields, exampleValues)
                };
                
                if (exampleValues.ContainsKey(field.Path))
                {
                    dto.SampleValues = exampleValues[field.Path];
                    // Also update single example if empty
                    if (string.IsNullOrEmpty(dto.ExampleValue) && dto.SampleValues.Any())
                    {
                        dto.ExampleValue = dto.SampleValues.First();
                    }
                }

                list.Add(dto);
            }
            return list;
        }

        private async Task<Dictionary<string, List<string>>> GetAggregatedExamples(DataObject dataObject)
        {
            var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            
            // Limit checks to prevent performance issues
            // Check only latest 3 examples? Or all? Let's do up to 3 files.
            var examples = dataObject.Examples.OrderByDescending(e => e.UploadedAt).Take(3).ToList();

            foreach (var example in examples)
            {
                try
                {
                    using var stream = await _fileStorage.GetFileAsync(example.FileStoragePath);
                    if (stream != null)
                    {
                         // SchemaType should match file extension or be consistent. 
                         // DataObject has SchemaType, but example files might be diff format?
                         // Usually we assume same format as SchemaType.
                         // But JSON schema might validate XML? No.
                         // Check file extension.
                         string type = "JSON";
                         if (example.FileName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase) || 
                             example.FileName.EndsWith(".xsd", StringComparison.OrdinalIgnoreCase))
                         {
                             type = "XSD";
                         }
                         
                         var values = await _exampleExtractor.ExtractExampleValuesAsync(stream, type, null);
                         
                         foreach(var kvp in values)
                         {
                             if (!result.ContainsKey(kvp.Key)) result[kvp.Key] = new List<string>();
                             
                             foreach(var val in kvp.Value)
                             {
                                 if (result[kvp.Key].Count < 3 && !result[kvp.Key].Contains(val))
                                 {
                                     result[kvp.Key].Add(val);
                                 }
                             }
                         }
                    }
                }
                catch
                {
                    // Ignore individual file errors
                }
            }
            return result;
        }
    }
}
