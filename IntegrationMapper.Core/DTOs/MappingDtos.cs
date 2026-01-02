namespace IntegrationMapper.Core.DTOs
{
    public class FieldDefinitionDto
    {
        public int Id { get; set; }
        public string Path { get; set; }
        public string Name { get; set; }
        public string DataType { get; set; }
        public List<FieldDefinitionDto> Children { get; set; } = new();
    }

    public class CreateMappingProjectDto
    {
        public string Name { get; set; }
        public int SourceObjectId { get; set; }
        public int TargetObjectId { get; set; }
    }

    public class MappingProjectDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int SourceObjectId { get; set; }
        public int TargetObjectId { get; set; }
        public string CreatedDate { get; set; }
    }

    public class MappingContextDto
    {
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
    }

    public class FieldMappingSuggestionDto
    {
        public int SourceFieldId { get; set; }
        public int TargetFieldId { get; set; }
        public double Confidence { get; set; }
        public string Reasoning { get; set; }
    }
}
