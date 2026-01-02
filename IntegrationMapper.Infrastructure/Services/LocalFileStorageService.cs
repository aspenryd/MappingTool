using IntegrationMapper.Core.Interfaces;
using Microsoft.Extensions.Hosting;

namespace IntegrationMapper.Infrastructure.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _storagePath;

        public LocalFileStorageService(IHostEnvironment environment)
        {
            // Store files in a "SchemaStorage" folder within the ContentRootPath
            _storagePath = Path.Combine(environment.ContentRootPath, "SchemaStorage");
            if (!Directory.Exists(_storagePath))
            {
                Directory.CreateDirectory(_storagePath);
            }
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName)
        {
            var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
            var filePath = Path.Combine(_storagePath, uniqueFileName);

            using (var outputStream = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(outputStream);
            }

            return uniqueFileName; // Returning filename as reference
        }

        public async Task<Stream> GetFileAsync(string fileReference)
        {
            var filePath = Path.Combine(_storagePath, fileReference);
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"File not found: {fileReference}");
            }

            return new FileStream(filePath, FileMode.Open, FileAccess.Read);
        }

        public Task DeleteFileAsync(string fileReference)
        {
            var filePath = Path.Combine(_storagePath, fileReference);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            return Task.CompletedTask;
        }
    }
}
