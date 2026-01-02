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
            var sourceObject = new DataObject { Id = 1, Name = "Source", SchemaType = "JSON", FileReference = "source.json" };
            var targetObject = new DataObject { Id = 2, Name = "Target", SchemaType = "JSON", FileReference = "target.json" };
            context.DataObjects.AddRange(sourceObject, targetObject);
            
            var sourceField = new FieldDefinition { Id = 10, Name = "SrcName", Path = "SrcName", DataObject = sourceObject, DataType = "String" };
            var targetField = new FieldDefinition { Id = 20, Name = "TgtName", Path = "TgtName", DataObject = targetObject, DataType = "String" };
            context.FieldDefinitions.AddRange(sourceField, targetField);

            var project = new MappingProject { Id = 100, Name = "Test Project", SourceObjectId = 1, TargetObjectId = 2 };
            context.MappingProjects.Add(project);

            await context.SaveChangesAsync();

            // Mock AI Service
            var mockAiService = new Mock<IAiMappingService>();
            var expectedSuggestions = new List<FieldMappingSuggestionDto>
            {
                new FieldMappingSuggestionDto { SourceFieldId = 10, TargetFieldId = 20, Confidence = 0.95, Reasoning = "Test Match" }
            };

            // Setup Mock to return specific suggestions when called
            mockAiService.Setup(s => s.SuggestMappingsAsync(It.IsAny<List<FieldDefinitionDto>>(), It.IsAny<List<FieldDefinitionDto>>()))
                .ReturnsAsync(expectedSuggestions);

            var controller = new MappingsController(context);

            // Act
            var result = await controller.SuggestMappings(100, mockAiService.Object);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var suggestions = Assert.IsType<List<FieldMappingSuggestionDto>>(okResult.Value);
            Assert.Single(suggestions);
            Assert.Equal(10, suggestions[0].SourceFieldId);
            Assert.Equal(20, suggestions[0].TargetFieldId);
        }
    }
}
