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
            var result = await _service.SuggestMappingsAsync(source, target, new List<int>());

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
            var result = await _service.SuggestMappingsAsync(source, target, new List<int>());

            // Assert
            Assert.Single(result);
            Assert.Equal(1, result[0].SourceFieldId); // Should pick Customer/Name (Id 1) over Product/Name (Id 2)
        }

        [Fact]
        public async Task SuggestMappings_ShouldEnforce_OneToOneMapping()
        {
            // Arrange
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
            var result = await _service.SuggestMappingsAsync(source, target, new List<int>());

            // Assert
            // Should match only the best one.
            Assert.Single(result); 
            Assert.Equal(101, result[0].TargetFieldId);
        }

        [Fact]
        public async Task SuggestMappings_ShouldIgnore_ExistingMappings()
        {
            // Arrange
            var source = new List<FieldDefinitionDto>
            {
                new FieldDefinitionDto { Id = 1, Name = "Name", Path = "Name" }
            };
            var target = new List<FieldDefinitionDto>
            {
                new FieldDefinitionDto { Id = 101, Name = "Name", Path = "Name" }
            };
            var existingTargetIds = new List<int> { 101 };

            // Act
            var result = await _service.SuggestMappingsAsync(source, target, existingTargetIds);

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task SuggestMappings_ShouldIgnore_NonLeafNodes()
        {
            // Arrange
            var source = new List<FieldDefinitionDto>
            {
                new FieldDefinitionDto 
                { 
                    Id = 1, 
                    Name = "Parent", 
                    Path = "Parent",
                    Children = new List<FieldDefinitionDto> // Has children -> should be ignored
                    {
                        new FieldDefinitionDto { Id = 2, Name = "Child", Path = "Parent/Child" }
                    }
                }
            };
            var target = new List<FieldDefinitionDto>
            {
                new FieldDefinitionDto { Id = 101, Name = "Parent", Path = "Parent" } // Name matches Parent, but Parent is not a leaf
            };

            // Act
            var result = await _service.SuggestMappingsAsync(source, target, new List<int>());

            // Assert
            // Should NOT map Parent (Id 1) because it has children.
            // Should it map Child (Id 2)? Child has no children.
            // Target has "Parent". "Child" vs "Parent" -> low score.
            // Expect Result Empty (or at least Id 1 is not mapped).
            Assert.DoesNotContain(result, r => r.SourceFieldId == 1 && r.TargetFieldId == 101);
        }
    }
}
