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
        public int? Length { get; set; }
        public bool IsArray { get; set; } // Identifies collection types
        public bool IsMandatory { get; set; }
        public string? SchemaAttributes { get; set; } // JSON string for generic schema metadata (pattern, format, etc.)
        public string? Description { get; set; }
        public string? ExampleValue { get; set; }
        public bool IsNullable { get; set; }

        public DataObject DataObject { get; set; }
        public FieldDefinition ParentField { get; set; }
        public ICollection<FieldDefinition> Children { get; set; } = new List<FieldDefinition>();
    }
}
