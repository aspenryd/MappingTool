using System.Collections.Generic;

namespace IntegrationMapper.Core.Entities
{
    public class FieldMappingSource
    {
        public int Id { get; set; }
        public int FieldMappingId { get; set; }
        public int SourceFieldId { get; set; }
        public int OrderIndex { get; set; }

        public FieldMapping FieldMapping { get; set; }
        public FieldDefinition SourceField { get; set; }
    }
}
