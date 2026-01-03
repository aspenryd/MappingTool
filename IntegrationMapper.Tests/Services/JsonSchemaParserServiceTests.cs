using IntegrationMapper.Infrastructure.Services;
using System.Text;
using Xunit;

namespace IntegrationMapper.Tests.Services
{
    public class JsonSchemaParserServiceTests
    {
        private readonly JsonSchemaParserService _service;

        public JsonSchemaParserServiceTests()
        {
            _service = new JsonSchemaParserService();
        }

        [Fact]
        public async Task ParseSchemaAsync_ShouldParse_SimpleJsonSchema()
        {
            // Arrange
            string json = @"{
                ""type"": ""object"",
                ""properties"": {
                    ""name"": { ""type"": ""string"", ""description"": ""The name"" },
                    ""age"": { ""type"": ""integer"" }
                }
            }";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(json));

            // Act
            var fields = await _service.ParseSchemaAsync(stream, "JSON");

            // Assert
            Assert.NotNull(fields);
            Assert.Equal(2, fields.Count);
            
            var nameField = fields.FirstOrDefault(f => f.Name == "name");
            Assert.NotNull(nameField);
            Assert.Equal("string", nameField.DataType);
            Assert.Equal("The name", nameField.Description);
            
            var ageField = fields.FirstOrDefault(f => f.Name == "age");
            Assert.NotNull(ageField);
            Assert.Equal("integer", ageField.DataType);
        }

        [Fact]
        public async Task ParseSchemaAsync_ShouldParse_NestedProperties()
        {
            // Arrange
            string json = @"{
                ""type"": ""object"",
                ""properties"": {
                    ""address"": {
                        ""type"": ""object"",
                        ""properties"": {
                            ""street"": { ""type"": ""string"" },
                            ""zip"": { ""type"": ""string"" }
                        }
                    }
                }
            }";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(json));

            // Act
            var fields = await _service.ParseSchemaAsync(stream, "JSON");

            // Assert
            // Expecting: address, address.street, address.zip (depending on implementation, flattening or tree)
            // The parser typically returns a flattened list for storage but with ParentField relations.
            
            var address = fields.FirstOrDefault(f => f.Name == "address");
            Assert.NotNull(address);
            Assert.Equal("object", address.DataType);

            // Check children
            // Depending on implementation, children might be in the list referencing parent
            var street = fields.FirstOrDefault(f => f.Name == "street");
            Assert.NotNull(street);
            Assert.Equal(address, street.ParentField);
            Assert.Equal("address.street", street.Path);
        }
    }
}
