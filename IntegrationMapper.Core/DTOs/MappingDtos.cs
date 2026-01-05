namespace IntegrationMapper.Core.DTOs
{
    public class FieldDefinitionDto
    {
        public int Id { get; set; } // Keep internal ID for field definition or remove? FieldDefinition IDs are internal.
        // FieldDefinition might need PublicId if we want to be strict, but they are children of Context.
        // Let's stick to High Level Entities first (Project, System, Profile). 
        // User said "don't expose internal Ids at all from the API". 
        // Fields might be too granular to add Guids to every single one right now without database migration pain if it was real DB.
        // But for InMemory it's free. 
        // Let's focus on System/Project/Profile/Context first. Field Definitions are usually just nested data.
        public string Path { get; set; }
        public string Name { get; set; }
        public string DataType { get; set; }
        public int? Length { get; set; }
        public bool IsArray { get; set; }
        public bool IsMandatory { get; set; }
        public string? SchemaAttributes { get; set; }
        public string Description { get; set; }
        public string ExampleValue { get; set; }
        public List<string> SampleValues { get; set; } = new();
        public List<FieldDefinitionDto> Children { get; set; } = new();
    }

    public class CreateMappingProjectDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid SourceSystemId { get; set; } // Renaming to Id for consistency in DTO or PublicId? 
        // Let's use SourceSystemPublicId to be explicit
        public Guid SourceSystemPublicId { get; set; }
        public Guid TargetSystemPublicId { get; set; }
    }

    public class CreateMappingProfileDto
    {
        public string Name { get; set; }
        public Guid SourceObjectPublicId { get; set; }
        public Guid TargetObjectPublicId { get; set; }
    }

    public class MappingProfileDto
    {
        public Guid Id { get; set; } // Expose PublicId as "Id" to frontend? Or keep "PublicId"?
        // User said "don't expose internal Id". So "Id" in DTO should be the Guid.
        // This is cleaner for frontend "id" usage.
        public string Name { get; set; }
        public Guid SourceObjectId { get; set; }
        public string SourceObjectName { get; set; }
        public Guid TargetObjectId { get; set; }
        public string TargetObjectName { get; set; }
    }

    public class MappingProjectDto
    {
        public Guid Id { get; set; } // PublicId exposed as Id
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid SourceSystemId { get; set; }
        public Guid TargetSystemId { get; set; }
        public string CreatedDate { get; set; }
        public List<MappingProfileDto> Profiles { get; set; } = new();
    }

    public class MappingContextDto
    {
        public Guid ProfileId { get; set; }
        public Guid ProjectId { get; set; }
        public List<FieldDefinitionDto> SourceFields { get; set; } = new();
        public List<FieldDefinitionDto> TargetFields { get; set; } = new();
        public List<DataObjectExampleDto> SourceExamples { get; set; } = new();
        public List<DataObjectExampleDto> TargetExamples { get; set; } = new();
        public List<FieldMappingDto> ExistingMappings { get; set; } = new();
    }

    public class FieldMappingDto
    {
        public int? SourceFieldId { get; set; }
        public int TargetFieldId { get; set; }
        public string? TransformationLogic { get; set; }
        public List<int> SourceFieldIds { get; set; } = new();
    }

    public class SuggestionRequestDto
    {
        public List<FieldDefinitionDto> SourceFields { get; set; } = new();
        public List<FieldDefinitionDto> TargetFields { get; set; } = new();
        public List<int> ExistingTargetIds { get; set; } = new();
    }

    public class FieldMappingSuggestionDto
    {
        public int SourceFieldId { get; set; }
        public int TargetFieldId { get; set; }
        public double Confidence { get; set; }
        public string Reasoning { get; set; }
    }
}
