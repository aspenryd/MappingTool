# Backend Design & Logic

## 1. Domain Entities (`IntegrationMapper.Core.Entities`)

**MappingProject**
- Top-level container.
- Relations: `ICollection<MappingProfile> Profiles`

**MappingProfile**
- Represents a single mapping definition between two DataObjects.
- Properties: `SourceObjectId`, `TargetObjectId`, `Name`.
- Relations: `ICollection<FieldMapping> Mappings`.

**FieldMapping**
- Represents a link between fields.
- Properties: `ProfileId`, `SourceFieldId`, `TargetFieldId`, `TransformationLogic`.

## 2. DTO Classes (`IntegrationMapper.Core.DTOs`)

```csharp
public class MappingProjectDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public List<MappingProfileDto> Profiles { get; set; }
}

public class MappingProfileDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int SourceObjectId { get; set; }
    public string SourceObjectName { get; set; }
    public int TargetObjectId { get; set; }
    public string TargetObjectName { get; set; }
}

public class MappingContextDto
{
    public int ProjectId { get; set; } // Parent Project
    public int ProfileId { get; set; } // Current Profile
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

## 3. Controller Design

### `MappingsController` (`api/projects`)
- `GET /`: List projects.
- `POST /`: Create project.
- `GET /{id}`: Get project details (with profiles).
- `POST /{id}/profiles`: Create a new profile.

### `MappingsController` (`api/profiles`)
- `GET /{profileId}/map`: Get Mapping Context (Source/Target fields + Existing mappings).
- `POST /{profileId}/map`: Save/Update a mapping.
- `DELETE /{profileId}/map/{targetFieldId}`: Delete a mapping.
- `POST /{profileId}/suggest`: Get AI suggestions.
- `GET /{profileId}/export/excel`: Download Excel spec.
- `GET /{profileId}/export/csharp`: Download C# code.
- `GET /{profileId}/code/csharp`: View C# code.

## 4. Services

Detailed documentation for the infrastructure services can be found in separate files:

*   **[AI Mapping Service](service_ai_mapping.md)**: Smart matching logic using `FuzzySharp`.
*   **[Schema Parsing](service_schema_parsing.md)**: `JsonSchemaParserService` and `XsdSchemaParserService`.
*   **[File Storage](service_storage.md)**: `LocalFileStorageService` implementation.

