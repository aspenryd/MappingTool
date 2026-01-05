namespace IntegrationMapper.Core.Entities
{
    public class DataObjectExample
    {
        public int Id { get; set; }
        public Guid PublicId { get; set; } = Guid.NewGuid();
        public int DataObjectId { get; set; }
        public string FileName { get; set; }
        public string FileStoragePath { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public DataObject DataObject { get; set; }
    }
}
