namespace IntegrationMapper.Core.Entities
{
    public class FieldMapping
    {
        public int Id { get; set; }
        public int ProfileId { get; set; }
        public int? SourceFieldId { get; set; }
        public int TargetFieldId { get; set; }
        public string? TransformationLogic { get; set; }
        public double? ConfidenceScore { get; set; }

        public MappingProfile Profile { get; set; }
        public FieldDefinition SourceField { get; set; }
        public FieldDefinition TargetField { get; set; }
        public ICollection<FieldMappingSource> Sources { get; set; } = new List<FieldMappingSource>();
    }
}
