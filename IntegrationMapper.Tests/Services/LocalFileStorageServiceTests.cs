using IntegrationMapper.Infrastructure.Services;
using Microsoft.Extensions.Hosting;
using Moq;
using System.Text;
using Xunit;

namespace IntegrationMapper.Tests.Services
{
    public class LocalFileStorageServiceTests
    {
        private readonly string _testPath;
        private readonly LocalFileStorageService _service;

        public LocalFileStorageServiceTests()
        {
            _testPath = Path.Combine(Path.GetTempPath(), "IntegrationMapperTests_" + Guid.NewGuid());
            Directory.CreateDirectory(_testPath);

            var mockEnv = new Mock<IHostEnvironment>();
            mockEnv.Setup(e => e.ContentRootPath).Returns(_testPath);

            _service = new LocalFileStorageService(mockEnv.Object);
        }

        [Fact]
        public async Task UploadFileAsync_ShouldSaveFile_AndReturnReference()
        {
            // Arrange
            string fileName = "test.txt";
            string content = "Hello World";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));

            // Act
            var reference = await _service.UploadFileAsync(stream, fileName);

            // Assert
            Assert.NotNull(reference);
            Assert.Contains(fileName, reference);

            // Verify physical existence
            string? savedPath = Directory.GetFiles(Path.Combine(_testPath, "SchemaStorage"), "*" + fileName).FirstOrDefault();
            Assert.NotNull(savedPath);
            Assert.True(File.Exists(savedPath));
        }

        [Fact]
        public async Task GetFileAsync_ShouldReturnStream_ForExistingFile()
        {
             // Arrange
            string fileName = "read.txt";
            string content = "Read Me";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
            var reference = await _service.UploadFileAsync(stream, fileName);

            // Act
            using var retrievedStream = await _service.GetFileAsync(reference);
            using var reader = new StreamReader(retrievedStream);
            var result = await reader.ReadToEndAsync();

            // Assert
            Assert.Equal(content, result);
        }
    }
}
