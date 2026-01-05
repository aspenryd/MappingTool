using Microsoft.AspNetCore.Http;

namespace IntegrationMapper.Core.DTOs
{
    public class IngestSchemaDto
    {
        public Guid SystemPublicId { get; set; }
        public string Name { get; set; }
        public IFormFile File { get; set; }
    }

    public class SchemaUploadResponseDto
    {
        public Guid DataObjectPublicId { get; set; }
        public string Name { get; set; }
        public int FieldCount { get; set; }
    }

    public class DataObjectDto
    {
        public Guid Id { get; set; }
        public Guid SystemPublicId { get; set; }
        public string Name { get; set; }
        public string SchemaType { get; set; }
        public string FileReference { get; set; }
        public List<DataObjectExampleDto> Examples { get; set; } = new();
    }

    public class DataObjectExampleDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
