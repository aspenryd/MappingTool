namespace IntegrationMapper.Core.Entities
{
    public class IntegrationSystem
    {
        public int Id { get; set; }
        public string ExternalId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        
        // Navigation properties
        public ICollection<DataObject> DataObjects { get; set; } = new List<DataObject>();
    }
}
