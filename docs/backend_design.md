# Backend Design & Logic

## 1. DTO Classes (`IntegrationMapper.Core.DTOs`)

```csharp
public class FieldDefinitionDto
{
    public int Id { get; set; }
    public string Path { get; set; }
    public string Name { get; set; }
    public string DataType { get; set; }
    public List<FieldDefinitionDto> Children { get; set; } = new();
}

public class MappingProjectDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int SourceObjectId { get; set; }
    public int TargetObjectId { get; set; }
}

public class MappingContextDto
{
    public int ProjectId { get; set; }
    public List<FieldDefinitionDto> SourceFields { get; set; }
    public List<FieldDefinitionDto> TargetFields { get; set; }
    public List<FieldMappingDto> ExistingMappings { get; set; }
}

public class FieldMappingDto
{
    public int? SourceFieldId { get; set; }
    public int TargetFieldId { get; set; }
    public string TransformationLogic { get; set; }
}
```

## 2. Controller Design (`IntegrationMapper.Api.Controllers.MappingsController`)

```csharp
[ApiController]
[Route("api/projects/{projectId}/map")]
public class MappingsController : ControllerBase
{
    private readonly IMappingService _mappingService;

    public MappingsController(IMappingService mappingService)
    {
        _mappingService = mappingService;
    }

    [HttpGet]
    public async Task<ActionResult<MappingContextDto>> GetMappingContext(int projectId)
    {
        var context = await _mappingService.GetMappingContextAsync(projectId);
        if (context == null) return NotFound();
        return Ok(context);
    }

    [HttpPost]
    public async Task<IActionResult> SaveMapping(int projectId, [FromBody] FieldMappingDto mapping)
    {
        await _mappingService.SaveMappingAsync(projectId, mapping);
        return Ok();
    }
}
```

## 3. Schema Parser Service Interface (`IntegrationMapper.Core.Interfaces`)

```csharp
public interface ISchemaParserService
{
    /// <summary>
    /// Parses a schema file content and returns a flat or hierarchical list of field definitions.
    /// </summary>
    /// <param name="fileContent">Raw content of the schema file</param>
    /// <param name="schemaType">Type of schema (JSON, XSD, OpenAPI)</param>
    /// <returns>List of parsed field definitions</returns>
    Task<List<FieldDefinition>> ParseSchemaAsync(Stream fileContent, string schemaType);

    /// <summary>
    /// Validates if the file content matches the expected schema type.
    /// </summary>
    bool ValidateSchema(Stream fileContent, string schemaType);
}
```
