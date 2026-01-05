namespace IntegrationMapper.Core.Entities
{
    public class MappingProject
    {
        public int Id { get; set; }
        public Guid PublicId { get; set; } = Guid.NewGuid();
        public string Name { get; set; }
        public string Description { get; set; } // Added description for better project management
        public int SourceSystemId { get; set; }
        public int TargetSystemId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public ICollection<MappingProfile> Profiles { get; set; } = new List<MappingProfile>();
        
        // Navigation
        public virtual IntegrationSystem SourceSystem { get; set; }
        public virtual IntegrationSystem TargetSystem { get; set; }
    }
}
