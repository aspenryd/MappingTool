using IntegrationMapper.Api.Controllers;
using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Core.Interfaces;
using IntegrationMapper.Infrastructure.Data;
using IntegrationMapper.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace IntegrationMapper.Tests.Controllers
{
    public class SchemasControllerTests
    {
         private IntegrationMapperContext GetInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<IntegrationMapperContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new IntegrationMapperContext(options);
        }

        [Fact]
        public async Task IngestSchema_ShouldProcessFile_AndSaveDataObject()
        {
            // Arrange
            var context = GetInMemoryContext();
            var mockStorage = new Mock<IFileStorageService>();
            var mockJsonParser = new Mock<ISchemaParserService>();
            var mockXsdParser = new XsdSchemaParserService(); // Can use real one or mock
            var mockValidator = new Mock<ISchemaValidatorService>();
            var mockExtractor = new Mock<IExampleExtractionService>();

            mockStorage.Setup(s => s.UploadFileAsync(It.IsAny<Stream>(), It.IsAny<string>()))
                .ReturnsAsync("ref_123.json");

            mockJsonParser.Setup(p => p.ParseSchemaAsync(It.IsAny<Stream>(), "JSON"))
                .ReturnsAsync(new List<FieldDefinition> 
                { 
                    new FieldDefinition { Name = "Field1", Path = "Field1", DataType = "String" } 
                });

            var controller = new SchemasController(context, mockStorage.Object, mockJsonParser.Object, mockXsdParser, mockValidator.Object, mockExtractor.Object);

            // Mock File
            var fileMock = new Mock<IFormFile>();
            var content = "{}";
            var fileName = "test.json";
            var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));
            fileMock.Setup(_ => _.OpenReadStream()).Returns(stream);
            fileMock.Setup(_ => _.FileName).Returns(fileName);
            fileMock.Setup(_ => _.Length).Returns(stream.Length);

            // Ensure system exists with PublicId
            var sysGuid = Guid.NewGuid();
            context.IntegrationSystems.Add(new IntegrationSystem { Id = 1, PublicId = sysGuid, Name = "TestSys", Category="Cat", Description="Desc", ExternalId="Ext" });
            await context.SaveChangesAsync();

            var dto = new IngestSchemaDto { SystemPublicId = sysGuid, Name = "MyObject", File = fileMock.Object };

            // Act
            var result = await controller.IngestSchema(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<SchemaUploadResponseDto>(okResult.Value);
            Assert.Equal("MyObject", response.Name);
            
            // Verify DB
            var dbObj = await context.DataObjects.FirstAsync();
            Assert.Equal("MyObject", dbObj.Name);
            Assert.Equal("ref_123.json", dbObj.FileReference);
            
            var dbFields = await context.FieldDefinitions.ToListAsync();
            Assert.Single(dbFields);
            Assert.Equal("Field1", dbFields[0].Name);
        }
    }
}
