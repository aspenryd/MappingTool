using Microsoft.AspNetCore.Http;

namespace IntegrationMapper.Core.DTOs
{
    public class IngestSchemaDto
    {
        public int SystemId { get; set; }
        public string Name { get; set; }
        public IFormFile File { get; set; }
    }

    public class SchemaUploadResponseDto
    {
        public int DataObjectId { get; set; }
        public string Name { get; set; }
        public int FieldCount { get; set; }
    }
}
