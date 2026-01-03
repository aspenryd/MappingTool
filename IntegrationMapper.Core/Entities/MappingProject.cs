namespace IntegrationMapper.Core.Entities
{
    public class MappingProject
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; } // Added description for better project management
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public ICollection<MappingProfile> Profiles { get; set; } = new List<MappingProfile>();
    }
}
