namespace IntegrationMapper.Core.Entities
{
    public class MappingProject
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int SourceObjectId { get; set; }
        public int TargetObjectId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DataObject SourceObject { get; set; }
        public DataObject TargetObject { get; set; }
        public ICollection<FieldMapping> Mappings { get; set; } = new List<FieldMapping>();
    }
}
