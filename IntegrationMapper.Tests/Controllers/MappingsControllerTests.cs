using IntegrationMapper.Api.Controllers;
using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Core.Interfaces;
using IntegrationMapper.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace IntegrationMapper.Tests.Controllers
{
    public class MappingsControllerTests
    {
        private IntegrationMapperContext GetInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<IntegrationMapperContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new IntegrationMapperContext(options);
        }

        [Fact]
        public async Task SuggestMappings_ShouldReturnSuggestions_FromAiService()
        {
            // Arrange
            var context = GetInMemoryContext();
            
            // Seed Data
            // Ensure SystemId is set if required, or better yet, create a system first if FK required.
            // InMemory might not enforce FK but might enforce Required. Check Entity Config.
            // Assuming SystemId is required.
            
            var system = new IntegrationSystem { Id = 1, Name = "Sys", Category = "Test", Description = "Desc", ExternalId = "EXT" };
            context.IntegrationSystems.Add(system);
            
            var sourceObject = new DataObject { Id = 1, Name = "Source", SchemaType = "JSON", FileReference = "source.json", SystemId = 1, System = system };
            var targetObject = new DataObject { Id = 2, Name = "Target", SchemaType = "JSON", FileReference = "target.json", SystemId = 1, System = system };
            context.DataObjects.AddRange(sourceObject, targetObject);
            
            var sourceField = new FieldDefinition { Id = 10, Name = "SrcName", Path = "SrcName", DataObject = sourceObject, DataObjectId = 1, DataType = "String" };
            var targetField = new FieldDefinition { Id = 20, Name = "TgtName", Path = "TgtName", DataObject = targetObject, DataObjectId = 2, DataType = "String" };
            context.FieldDefinitions.AddRange(sourceField, targetField);

            var project = new MappingProject { Id = 100, Name = "Test Project", Description = "Test Desc" };
            var profile = new MappingProfile 
            { 
                Id = 200, 
                Name = "Test Profile", 
                MappingProjectId = 100, 
                SourceObjectId = 1, 
                TargetObjectId = 2,
                Mappings = new List<FieldMapping>()
            };

            context.MappingProjects.Add(project);
            context.MappingProfiles.Add(profile);

            await context.SaveChangesAsync();

            // Mock AI Service
            var mockAiService = new Mock<IAiMappingService>();
            var expectedSuggestions = new List<FieldMappingSuggestionDto>
            {
                new FieldMappingSuggestionDto { SourceFieldId = 10, TargetFieldId = 20, Confidence = 0.95, Reasoning = "Test Match" }
            };

            // Setup Mock to return specific suggestions when called
            mockAiService.Setup(s => s.SuggestMappingsAsync(It.IsAny<List<FieldDefinitionDto>>(), It.IsAny<List<FieldDefinitionDto>>(), It.IsAny<List<int>>()))
                .ReturnsAsync(expectedSuggestions);

            var controller = new MappingsController(context);

            // Act
            // Call SuggestMappings with profileId (200)
            var result = await controller.SuggestMappings(200, mockAiService.Object);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var suggestions = Assert.IsType<List<FieldMappingSuggestionDto>>(okResult.Value);
            Assert.Single(suggestions);
            Assert.Equal(10, suggestions[0].SourceFieldId);
            Assert.Equal(20, suggestions[0].TargetFieldId);
        }
    }
}
