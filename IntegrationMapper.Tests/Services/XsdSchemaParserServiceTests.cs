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
        [Fact]
        public async Task ParseSchemaAsync_ShouldDetect_MandatoryFields()
        {
            // Arrange
            string xsd = @"<?xml version=""1.0""?>
<xs:schema xmlns:xs=""http://www.w3.org/2001/XMLSchema"">
  <xs:element name=""note"">
    <xs:complexType>
      <xs:sequence>
        <xs:element name=""requiredField"" type=""xs:string"" minOccurs=""1""/>
        <xs:element name=""optionalField"" type=""xs:string"" minOccurs=""0""/>
        <xs:element name=""attributeField"">
             <xs:complexType>
                 <xs:attribute name=""requiredAttr"" use=""required""/>
                 <xs:attribute name=""optionalAttr"" use=""optional""/>
             </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(xsd));

            // Act
            var fields = await _service.ParseSchemaAsync(stream, "XSD");

            // Assert
            var requiredField = fields.FirstOrDefault(f => f.Name == "requiredField");
            Assert.NotNull(requiredField);
            Assert.True(requiredField.IsMandatory, "requiredField should be mandatory");

            var optionalField = fields.FirstOrDefault(f => f.Name == "optionalField");
            Assert.NotNull(optionalField);
            Assert.False(optionalField.IsMandatory, "optionalField should not be mandatory");

            // Attributes are slightly trickier depending on how parser handles them (flattened or children)
            // Assuming they appear in list
             var requiredAttr = fields.FirstOrDefault(f => f.Name == "requiredAttr");
             if (requiredAttr != null) 
                Assert.True(requiredAttr.IsMandatory, "requiredAttr should be mandatory");
        }

        [Fact]
        public async Task ParseSchemaAsync_ShouldDefaultToOptional_WhenMinOccursMissing()
        {
            // Arrange
            // 'defaultField' has no minOccurs. Standard XSD = Mandatory. User Custom Rule = Optional.
            string xsd = @"<?xml version=""1.0""?>
<xs:schema xmlns:xs=""http://www.w3.org/2001/XMLSchema"">
  <xs:element name=""root"">
    <xs:complexType>
      <xs:sequence>
        <xs:element name=""defaultField"" type=""xs:string""/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(xsd));

            // Act
            var fields = await _service.ParseSchemaAsync(stream, "XSD");

            // Assert
            var field = fields.FirstOrDefault(f => f.Name == "defaultField");
            Assert.NotNull(field);
            Assert.False(field.IsMandatory, "Field without minOccurs should be optional by default per user rule");
        }
    }
}
