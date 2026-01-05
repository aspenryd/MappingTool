namespace IntegrationMapper.Core.Entities
{
    public class DataObject
    {
        public int Id { get; set; }
        public Guid PublicId { get; set; } = Guid.NewGuid();
        public int IntegrationSystemId { get; set; }
        public string Name { get; set; }
        public string SchemaType { get; set; } // JSON, XSD, OPENAPI
        public string FileReference { get; set; }

        public IntegrationSystem System { get; set; }
        public ICollection<FieldDefinition> Fields { get; set; } = new List<FieldDefinition>();
        public ICollection<DataObjectExample> Examples { get; set; } = new List<DataObjectExample>();
    }
}
