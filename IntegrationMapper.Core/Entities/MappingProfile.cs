using System.Collections.Generic;

namespace IntegrationMapper.Core.Entities
{
    public class MappingProfile
    {
        public int Id { get; set; }
        public int MappingProjectId { get; set; }
        public string Name { get; set; } // e.g. "Order Header -> Order Header"

        public int SourceObjectId { get; set; }
        public int TargetObjectId { get; set; }

        public MappingProject MappingProject { get; set; }
        public DataObject SourceObject { get; set; }
        public DataObject TargetObject { get; set; }

        public ICollection<FieldMapping> Mappings { get; set; } = new List<FieldMapping>();
    }
}
