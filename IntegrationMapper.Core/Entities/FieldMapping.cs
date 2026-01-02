namespace IntegrationMapper.Core.Entities
{
    public class FieldMapping
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int? SourceFieldId { get; set; }
        public int TargetFieldId { get; set; }
        public string? TransformationLogic { get; set; }
        public double? ConfidenceScore { get; set; }

        public MappingProject Project { get; set; }
        public FieldDefinition SourceField { get; set; }
        public FieldDefinition TargetField { get; set; }
    }
}
