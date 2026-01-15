using IntegrationMapper.Api.Controllers;
using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace IntegrationMapper.Tests.Controllers
{
    public class AdminControllerTests
    {
        private IntegrationMapperContext GetInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<IntegrationMapperContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new IntegrationMapperContext(options);
        }

        [Fact]
        public async Task BatchUploadSystems_ShouldCreateNewSystems()
        {
            // Arrange
            var context = GetInMemoryContext();
            var controller = new AdminController(context);
            var dto = new BatchSystemsUploadDto
            {
                Systems = new List<CreateSystemDto>
                {
                    new() { Name = "System1", ExternalId = "EXT1", Description = "Desc1", Category = "ERP" },
                    new() { Name = "System2", ExternalId = "EXT2", Description = "Desc2", Category = "CRM" }
                }
            };

            // Act
            var result = await controller.BatchUploadSystems(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var batchResult = Assert.IsType<BatchUploadResultDto>(okResult.Value);
            Assert.Equal(2, batchResult.SuccessCount);
            Assert.Equal(0, batchResult.ErrorCount);
            Assert.Equal(2, await context.IntegrationSystems.CountAsync());
        }

        [Fact]
        public async Task BatchUploadSystems_ShouldUpdateExistingSystems()
        {
            // Arrange
            var context = GetInMemoryContext();
            context.IntegrationSystems.Add(new IntegrationSystem 
            { 
                Name = "OldName", 
                ExternalId = "EXT1", 
                Description = "OldDesc", 
                Category = "OLD" 
            });
            await context.SaveChangesAsync();

            var controller = new AdminController(context);
            var dto = new BatchSystemsUploadDto
            {
                Systems = new List<CreateSystemDto>
                {
                    new() { Name = "NewName", ExternalId = "EXT1", Description = "NewDesc", Category = "ERP" }
                }
            };

            // Act
            var result = await controller.BatchUploadSystems(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var batchResult = Assert.IsType<BatchUploadResultDto>(okResult.Value);
            Assert.Equal(1, batchResult.SuccessCount);
            
            var system = await context.IntegrationSystems.FirstAsync();
            Assert.Equal("NewName", system.Name);
            Assert.Equal("NewDesc", system.Description);
            Assert.Equal("ERP", system.Category);
        }

        [Fact]
        public async Task BatchUploadDataObjects_ShouldReportErrorForMissingSystem()
        {
            // Arrange
            var context = GetInMemoryContext();
            var controller = new AdminController(context);
            var dto = new BatchDataObjectsUploadDto
            {
                DataObjects = new List<BatchDataObjectDto>
                {
                    new() 
                    { 
                        SystemId = Guid.NewGuid(), // Non-existent system
                        Name = "TestObject", 
                        SchemaType = "json" 
                    }
                }
            };

            // Act
            var result = await controller.BatchUploadDataObjects(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var batchResult = Assert.IsType<BatchUploadResultDto>(okResult.Value);
            Assert.Equal(0, batchResult.SuccessCount);
            Assert.Equal(1, batchResult.ErrorCount);
            Assert.Single(batchResult.Errors);
        }

        [Fact]
        public async Task BatchUploadProjects_ShouldReportErrorForMissingSourceSystem()
        {
            // Arrange
            var context = GetInMemoryContext();
            var controller = new AdminController(context);
            var dto = new BatchProjectsUploadDto
            {
                Projects = new List<BatchMappingProjectDto>
                {
                    new() 
                    { 
                        Name = "TestProject",
                        SourceSystemExternalId = "NON_EXISTENT",
                        TargetSystemExternalId = "ALSO_NON_EXISTENT"
                    }
                }
            };

            // Act
            var result = await controller.BatchUploadProjects(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var batchResult = Assert.IsType<BatchUploadResultDto>(okResult.Value);
            Assert.Equal(0, batchResult.SuccessCount);
            Assert.Equal(1, batchResult.ErrorCount);
        }
    }
}
