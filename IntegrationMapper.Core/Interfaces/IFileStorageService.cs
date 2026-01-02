namespace IntegrationMapper.Core.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> UploadFileAsync(Stream fileStream, string fileName);
        Task<Stream> GetFileAsync(string fileReference);
        Task DeleteFileAsync(string fileReference);
    }
}
