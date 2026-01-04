using IntegrationMapper.Infrastructure.Services;
using System.Text;
using Xunit;

namespace IntegrationMapper.Tests.Services
{
    public class SchemaValidatorServiceTests
    {
        private readonly SchemaValidatorService _service;

        public SchemaValidatorServiceTests()
        {
            _service = new SchemaValidatorService();
        }

        [Fact]
        public async Task ValidateExampleAsync_JSON_ShouldPass_ValidJson()
        {
            // Arrange
            string schema = @"{ ""type"": ""object"", ""properties"": { ""name"": { ""type"": ""string"" } }, ""required"": [""name""] }";
            string example = @"{ ""name"": ""Test"" }";

            using var schemaStream = new MemoryStream(Encoding.UTF8.GetBytes(schema));
            using var exampleStream = new MemoryStream(Encoding.UTF8.GetBytes(example));

            // Act
            var errors = await _service.ValidateExampleAsync(schemaStream, "JSON", exampleStream);

            // Assert
            Assert.Empty(errors);
        }

        [Fact]
        public async Task ValidateExampleAsync_JSON_ShouldFail_InvalidJson()
        {
            // Arrange
            string schema = @"{ ""type"": ""object"", ""properties"": { ""name"": { ""type"": ""string"" } }, ""required"": [""name""] }";
            string example = @"{ ""age"": 123 }"; // Missing name

            using var schemaStream = new MemoryStream(Encoding.UTF8.GetBytes(schema));
            using var exampleStream = new MemoryStream(Encoding.UTF8.GetBytes(example));

            // Act
            var errors = await _service.ValidateExampleAsync(schemaStream, "JSON", exampleStream);

            // Assert
            Assert.NotEmpty(errors);
            Assert.Contains(errors, e => e.Contains("Required"));
        }

        [Fact]
        public async Task ValidateExampleAsync_XSD_ShouldPass_ValidXml()
        {
             // Arrange
            string xsd = @"<?xml version=""1.0""?>
<xs:schema xmlns:xs=""http://www.w3.org/2001/XMLSchema"">
  <xs:element name=""note"">
    <xs:complexType>
      <xs:sequence>
        <xs:element name=""to"" type=""xs:string""/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>";
            string xml = @"<note><to>User</to></note>";

            using var schemaStream = new MemoryStream(Encoding.UTF8.GetBytes(xsd));
            using var exampleStream = new MemoryStream(Encoding.UTF8.GetBytes(xml));

            // Act
             var errors = await _service.ValidateExampleAsync(schemaStream, "XSD", exampleStream);

            // Assert
             Assert.Empty(errors);
        }

         [Fact]
        public async Task ValidateExampleAsync_XSD_ShouldFail_InvalidXml()
        {
             // Arrange
            string xsd = @"<?xml version=""1.0""?>
<xs:schema xmlns:xs=""http://www.w3.org/2001/XMLSchema"">
  <xs:element name=""note"">
    <xs:complexType>
      <xs:sequence>
        <xs:element name=""to"" type=""xs:string""/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>";
            string xml = @"<note><from>User</from></note>"; // Wrong element

            using var schemaStream = new MemoryStream(Encoding.UTF8.GetBytes(xsd));
            using var exampleStream = new MemoryStream(Encoding.UTF8.GetBytes(xml));

            // Act
             var errors = await _service.ValidateExampleAsync(schemaStream, "XSD", exampleStream);

            // Assert
             Assert.NotEmpty(errors);
        }
    }
}
