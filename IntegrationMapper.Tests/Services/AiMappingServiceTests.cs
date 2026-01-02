using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Infrastructure.Services;
using Xunit;

namespace IntegrationMapper.Tests.Services
{
    public class AiMappingServiceTests
    {
        private readonly AiMappingService _service;

        public AiMappingServiceTests()
        {
            _service = new AiMappingService();
        }

        [Fact]
        public async Task SuggestMappings_ShouldMatch_ExactNames()
        {
            // Arrange
            var source = new List<FieldDefinitionDto>
            {
                new FieldDefinitionDto { Id = 1, Name = "CustomerName", Path = "CustomerName" }
            };
            var target = new List<FieldDefinitionDto>
            {
                new FieldDefinitionDto { Id = 101, Name = "CustomerName", Path = "CustomerName" }
            };

            // Act
            var result = await _service.SuggestMappingsAsync(source, target);

            // Assert
            Assert.Single(result);
            Assert.Equal(1, result[0].SourceFieldId);
            Assert.Equal(101, result[0].TargetFieldId);
            Assert.True(result[0].Confidence >= 0.9);
        }

        [Fact]
        public async Task SuggestMappings_ShouldPrioritize_PathContext()
        {
            // Arrange: Two fields named "Name", but paths differ
            var source = new List<FieldDefinitionDto>
            {
                new FieldDefinitionDto { Id = 1, Name = "Name", Path = "Order/Customer/Name" }, // Target match
                new FieldDefinitionDto { Id = 2, Name = "Name", Path = "Order/Product/Name" }
            };
            var target = new List<FieldDefinitionDto>
            {
                new FieldDefinitionDto { Id = 101, Name = "Name", Path = "OrderInfo/Customer/Name" }
            };

            // Act
            var result = await _service.SuggestMappingsAsync(source, target);

            // Assert
            Assert.Single(result);
            Assert.Equal(1, result[0].SourceFieldId); // Should pick Customer/Name (Id 1) over Product/Name (Id 2)
        }

        [Fact]
        public async Task SuggestMappings_ShouldEnforce_OneToOneMapping()
        {
            // Arrange: One Source "ID" vs Two Targets "ID" and "OldID"
            // Both might match "ID" strongly, but once "ID" is used, it shouldn't be used again?
            // Wait, 1-to-1 means a source can't map to multiple targets AND a target can't be mapped from multiple sources.
            
            var source = new List<FieldDefinitionDto>
            {
                new FieldDefinitionDto { Id = 1, Name = "AccountCode", Path = "AccountCode" }
            };
            var target = new List<FieldDefinitionDto>
            {
                new FieldDefinitionDto { Id = 101, Name = "AccountCode", Path = "AccountCode" }, // Exact match
                new FieldDefinitionDto { Id = 102, Name = "AccountCodeLegacy", Path = "AccountCodeLegacy" } // Partial match
            };

            // Act
            var result = await _service.SuggestMappingsAsync(source, target);

            // Assert
            // Should match only the best one.
            Assert.Single(result); 
            Assert.Equal(101, result[0].TargetFieldId);
        }
    }
}
