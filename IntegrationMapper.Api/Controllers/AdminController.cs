using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntegrationMapper.Api.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IntegrationMapperContext _context;

        public AdminController(IntegrationMapperContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Batch upload systems
        /// </summary>
        [HttpPost("systems/batch")]
        public async Task<ActionResult<BatchUploadResultDto>> BatchUploadSystems([FromBody] BatchSystemsUploadDto dto)
        {
            var result = new BatchUploadResultDto();

            foreach (var systemDto in dto.Systems)
            {
                try
                {
                    // Check for duplicate by ExternalId
                    var existing = await _context.IntegrationSystems
                        .FirstOrDefaultAsync(s => s.ExternalId == systemDto.ExternalId);
                    
                    if (existing != null)
                    {
                        // Update existing
                        existing.Name = systemDto.Name;
                        existing.Description = systemDto.Description;
                        existing.Category = systemDto.Category;
                    }
                    else
                    {
                        // Create new
                        var system = new IntegrationSystem
                        {
                            Name = systemDto.Name,
                            ExternalId = systemDto.ExternalId,
                            Description = systemDto.Description,
                            Category = systemDto.Category
                        };
                        _context.IntegrationSystems.Add(system);
                    }
                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    result.ErrorCount++;
                    result.Errors.Add($"Failed to import system '{systemDto.ExternalId}': {ex.Message}");
                }
            }

            await _context.SaveChangesAsync();
            return Ok(result);
        }

        /// <summary>
        /// Batch upload data objects with schemas and examples
        /// </summary>
        [HttpPost("dataobjects/batch")]
        public async Task<ActionResult<BatchUploadResultDto>> BatchUploadDataObjects([FromBody] BatchDataObjectsUploadDto dto)
        {
            var result = new BatchUploadResultDto();

            foreach (var objDto in dto.DataObjects)
            {
                try
                {
                    var system = await _context.IntegrationSystems
                        .FirstOrDefaultAsync(s => s.PublicId == objDto.SystemId);

                    if (system == null)
                    {
                        result.ErrorCount++;
                        result.Errors.Add($"System with ID '{objDto.SystemId}' not found for data object '{objDto.Name}'");
                        continue;
                    }

                    // Check for existing data object by name within the system
                    var existing = await _context.DataObjects
                        .Include(d => d.Examples)
                        .FirstOrDefaultAsync(d => d.IntegrationSystemId == system.Id && d.Name == objDto.Name);

                    if (existing != null)
                    {
                        // Update existing
                        existing.SchemaType = objDto.SchemaType;
                        existing.FileReference = objDto.SchemaContent; // Store schema content as file reference

                        // Clear and re-add examples (store content as file references)
                        _context.DataObjectExamples.RemoveRange(existing.Examples);
                        if (objDto.ExampleContents != null)
                        {
                            var index = 0;
                            foreach (var exampleContent in objDto.ExampleContents)
                            {
                                existing.Examples.Add(new DataObjectExample
                                {
                                    FileName = $"batch_example_{index++}.{(objDto.SchemaType == "xml" || objDto.SchemaType == "xsd" ? "xml" : "json")}",
                                    FileStoragePath = exampleContent // Store content as path/reference
                                });
                            }
                        }
                    }
                    else
                    {
                        // Create new
                        var dataObject = new DataObject
                        {
                            Name = objDto.Name,
                            IntegrationSystemId = system.Id,
                            SchemaType = objDto.SchemaType,
                            FileReference = objDto.SchemaContent // Store schema content as file reference
                        };

                        if (objDto.ExampleContents != null)
                        {
                            var index = 0;
                            foreach (var exampleContent in objDto.ExampleContents)
                            {
                                dataObject.Examples.Add(new DataObjectExample
                                {
                                    FileName = $"batch_example_{index++}.{(objDto.SchemaType == "xml" || objDto.SchemaType == "xsd" ? "xml" : "json")}",
                                    FileStoragePath = exampleContent // Store content as path/reference
                                });
                            }
                        }

                        _context.DataObjects.Add(dataObject);
                    }
                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    result.ErrorCount++;
                    result.Errors.Add($"Failed to import data object '{objDto.Name}': {ex.Message}");
                }
            }

            await _context.SaveChangesAsync();
            return Ok(result);
        }

        /// <summary>
        /// Batch upload projects with profiles and mappings
        /// </summary>
        [HttpPost("projects/batch")]
        public async Task<ActionResult<BatchUploadResultDto>> BatchUploadProjects([FromBody] BatchProjectsUploadDto dto)
        {
            var result = new BatchUploadResultDto();

            foreach (var projectDto in dto.Projects)
            {
                try
                {
                    // Find source and target systems by ExternalId
                    var sourceSystem = await _context.IntegrationSystems
                        .Include(s => s.DataObjects)
                        .ThenInclude(d => d.Fields)
                        .FirstOrDefaultAsync(s => s.ExternalId == projectDto.SourceSystemExternalId);

                    var targetSystem = await _context.IntegrationSystems
                        .Include(s => s.DataObjects)
                        .ThenInclude(d => d.Fields)
                        .FirstOrDefaultAsync(s => s.ExternalId == projectDto.TargetSystemExternalId);

                    if (sourceSystem == null)
                    {
                        result.ErrorCount++;
                        result.Errors.Add($"Source system '{projectDto.SourceSystemExternalId}' not found for project '{projectDto.Name}'");
                        continue;
                    }

                    if (targetSystem == null)
                    {
                        result.ErrorCount++;
                        result.Errors.Add($"Target system '{projectDto.TargetSystemExternalId}' not found for project '{projectDto.Name}'");
                        continue;
                    }

                    // Create or update project
                    var existingProject = await _context.MappingProjects
                        .Include(p => p.Profiles)
                        .ThenInclude(pr => pr.Mappings)
                        .FirstOrDefaultAsync(p => p.Name == projectDto.Name);

                    MappingProject project;
                    if (existingProject != null)
                    {
                        project = existingProject;
                        project.Description = projectDto.Description;
                        project.SourceSystemId = sourceSystem.Id;
                        project.TargetSystemId = targetSystem.Id;
                    }
                    else
                    {
                        project = new MappingProject
                        {
                            Name = projectDto.Name,
                            Description = projectDto.Description,
                            SourceSystemId = sourceSystem.Id,
                            TargetSystemId = targetSystem.Id,
                            CreatedDate = DateTime.UtcNow
                        };
                        _context.MappingProjects.Add(project);
                    }

                    // Process profiles
                    foreach (var profileDto in projectDto.Profiles)
                    {
                        var sourceObj = sourceSystem.DataObjects.FirstOrDefault(d => d.Name == profileDto.SourceObjectName);
                        var targetObj = targetSystem.DataObjects.FirstOrDefault(d => d.Name == profileDto.TargetObjectName);

                        if (sourceObj == null || targetObj == null)
                        {
                            result.Errors.Add($"Data objects not found for profile '{profileDto.Name}' in project '{projectDto.Name}'");
                            continue;
                        }

                        var existingProfile = project.Profiles.FirstOrDefault(p => p.Name == profileDto.Name);
                        MappingProfile profile;

                        if (existingProfile != null)
                        {
                            profile = existingProfile;
                            profile.SourceObjectId = sourceObj.Id;
                            profile.TargetObjectId = targetObj.Id;
                            // Clear existing mappings
                            profile.Mappings.Clear();
                        }
                        else
                        {
                            profile = new MappingProfile
                            {
                                Name = profileDto.Name,
                                SourceObjectId = sourceObj.Id,
                                TargetObjectId = targetObj.Id,
                                MappingProject = project
                            };
                            project.Profiles.Add(profile);
                        }

                        // Process mappings
                        foreach (var mappingDto in profileDto.Mappings)
                        {
                            var sourceField = sourceObj.Fields.FirstOrDefault(f => f.Path == mappingDto.SourceFieldPath);
                            var targetField = targetObj.Fields.FirstOrDefault(f => f.Path == mappingDto.TargetFieldPath);

                            if (sourceField != null && targetField != null)
                            {
                                profile.Mappings.Add(new FieldMapping
                                {
                                    SourceFieldId = sourceField.Id,
                                    TargetFieldId = targetField.Id,
                                    TransformationLogic = mappingDto.TransformationLogic
                                });
                            }
                        }
                    }

                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    result.ErrorCount++;
                    result.Errors.Add($"Failed to import project '{projectDto.Name}': {ex.Message}");
                }
            }

            await _context.SaveChangesAsync();
            return Ok(result);
        }
    }
}
