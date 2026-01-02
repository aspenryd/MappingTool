namespace IntegrationMapper.Core.Entities
{
    public class FieldDefinition
    {
        public int Id { get; set; }
        public int DataObjectId { get; set; }
        public int? ParentFieldId { get; set; }
        public string Path { get; set; }
        public string Name { get; set; }
        public string DataType { get; set; }
        public string? ExampleValue { get; set; }
        public string? Description { get; set; }

        public DataObject DataObject { get; set; }
        public FieldDefinition ParentField { get; set; }
        public ICollection<FieldDefinition> Children { get; set; } = new List<FieldDefinition>();
    }
}
