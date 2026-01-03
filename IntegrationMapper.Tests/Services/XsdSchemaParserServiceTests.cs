using IntegrationMapper.Infrastructure.Services;
using System.Text;
using Xunit;

namespace IntegrationMapper.Tests.Services
{
    public class XsdSchemaParserServiceTests
    {
        private readonly XsdSchemaParserService _service;

        public XsdSchemaParserServiceTests()
        {
            _service = new XsdSchemaParserService();
        }

        [Fact]
        public async Task ParseSchemaAsync_ShouldParse_SimpleXsd()
        {
            // Arrange
            string xsd = @"<?xml version=""1.0""?>
<xs:schema xmlns:xs=""http://www.w3.org/2001/XMLSchema"">
  <xs:element name=""note"">
    <xs:complexType>
      <xs:sequence>
        <xs:element name=""to"" type=""xs:string""/>
        <xs:element name=""from"" type=""xs:string""/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(xsd));

            // Act
            var fields = await _service.ParseSchemaAsync(stream, "XSD");

            // Assert
            Assert.NotNull(fields);
            // note, to, from
            Assert.Contains(fields, f => f.Name == "note");
            Assert.Contains(fields, f => f.Name == "to");
            Assert.Contains(fields, f => f.Name == "from");
        }
    }
}
