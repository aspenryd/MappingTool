using IntegrationMapper.Api.Controllers;
using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace IntegrationMapper.Tests.Controllers
{
    public class SystemsControllerTests
    {
        private IntegrationMapperContext GetInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<IntegrationMapperContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new IntegrationMapperContext(options);
        }

        [Fact]
        public async Task GetSystems_ShouldReturn_ListOfSystems()
        {
            // Arrange
            var context = GetInMemoryContext();
            context.IntegrationSystems.Add(new IntegrationSystem { Name = "Sys1", Category = "ERP", Description = "Desc1", ExternalId = "EXT1" });
            context.IntegrationSystems.Add(new IntegrationSystem { Name = "Sys2", Category = "CRM", Description = "Desc2", ExternalId = "EXT2" });
            await context.SaveChangesAsync();

            var controller = new SystemsController(context);

            // Act
            var result = await controller.GetSystems();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var systems = Assert.IsType<List<IntegrationSystemDto>>(okResult.Value);
            Assert.Equal(2, systems.Count);
        }

        [Fact]
        public async Task AddSystem_ShouldAdd_AndReturnSystem()
        {
            // Arrange
            var context = GetInMemoryContext();
            var controller = new SystemsController(context);
            var dto = new CreateSystemDto { Name = "NewSys", Category = "ERP", Description = "Test", ExternalId = "EXT_NEW" };

            // Act
            var result = await controller.CreateSystem(dto);

            // Assert
            var createdAtResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var systemDto = Assert.IsType<IntegrationSystemDto>(createdAtResult.Value);
            Assert.Equal("NewSys", systemDto.Name);
            Assert.NotEqual(0, systemDto.Id);
            
            // Verify DB
            Assert.Single(context.IntegrationSystems);
        }
    }
}
