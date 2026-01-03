namespace IntegrationMapper.Core.DTOs
{
    public class FieldDefinitionDto
    {
        public int Id { get; set; }
        public string Path { get; set; }
        public string Name { get; set; }
        public string DataType { get; set; }
        public int? Length { get; set; }
        public string? ExampleValue { get; set; }
        public string? Description { get; set; }
        public List<FieldDefinitionDto> Children { get; set; } = new();
    }

    public class CreateMappingProjectDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }

    public class CreateMappingProfileDto
    {
        public string Name { get; set; }
        public int SourceObjectId { get; set; }
        public int TargetObjectId { get; set; }
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

    public class MappingProjectDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string CreatedDate { get; set; }
        public List<MappingProfileDto> Profiles { get; set; } = new();
    }

    public class MappingContextDto
    {
        public int ProfileId { get; set; }
        public int ProjectId { get; set; }
        public List<FieldDefinitionDto> SourceFields { get; set; } = new();
        public List<FieldDefinitionDto> TargetFields { get; set; } = new();
        public List<FieldMappingDto> ExistingMappings { get; set; } = new();
    }

    public class FieldMappingDto
    {
        public int? SourceFieldId { get; set; }
        public int TargetFieldId { get; set; }
        public string? TransformationLogic { get; set; }
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
