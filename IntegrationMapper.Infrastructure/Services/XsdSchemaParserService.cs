using System.Xml.Schema;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Core.Interfaces;

namespace IntegrationMapper.Infrastructure.Services
{
    public class XsdSchemaParserService : ISchemaParserService
    {
        public bool ValidateSchema(Stream fileContent, string schemaType)
        {
            return schemaType?.ToUpper() == "XSD";
        }

        public async Task<List<FieldDefinition>> ParseSchemaAsync(Stream schemaStream, string format)
        {
            if (format?.ToUpper() != "XSD")
            {
                throw new ArgumentException("Invalid format for XSD parser");
            }

            var fields = new List<FieldDefinition>();
            var schema = XmlSchema.Read(schemaStream, (sender, args) =>
            {
                // Handle validation errors if necessary
            });

            if (schema == null) return fields;

            var set = new XmlSchemaSet();
            set.Add(schema);
            set.Compile();

            foreach (XmlSchemaElement element in schema.Elements.Values)
            {
                ParseElement(element, fields, null);
            }

            return fields;
        }

        private void ParseElement(XmlSchemaElement element, List<FieldDefinition> fields, FieldDefinition parent)
        {
            // Collect generic schema attributes
            var schemaAttrs = new Dictionary<string, object>
            {
                { "minOccurs", element.MinOccurs },
                { "maxOccurs", element.MaxOccursString }
            };

            var field = new FieldDefinition
            {
                Name = element.Name ?? "Unnamed", 
                Path = parent == null ? (element.Name ?? "Root") : $"{parent.Path}.{element.Name ?? "Item"}",
                DataType = element.SchemaTypeName.Name,
                ParentField = parent,
                IsNullable = element.MinOccurs == 0,
                // User Request: Default to optional (False) if not specified. Standard XSD default is 1 (True).
                // Check if MinOccursString is present. If null, assume 0 (False).
                IsMandatory = !string.IsNullOrEmpty(element.MinOccursString) ? element.MinOccurs > 0 : false,
                IsArray = element.MaxOccurs > 1 || element.MaxOccursString == "unbounded",
                SchemaAttributes = System.Text.Json.JsonSerializer.Serialize(schemaAttrs),
                ExampleValue = element.FixedValue ?? element.DefaultValue
            };

            if (string.IsNullOrEmpty(element.Name) && !element.RefName.IsEmpty)
            {
                field.Name = element.RefName.Name;
                field.Path = parent == null ? field.Name : $"{parent.Path}.{field.Name}";
            }

            if (element.ElementSchemaType is XmlSchemaSimpleType simpleType)
            {
                field.DataType = simpleType.Name ?? simpleType.TypeCode.ToString();
                
                if (simpleType.Content is XmlSchemaSimpleTypeRestriction restriction)
                {
                    // Extract Length
                    var maxLengthFacet = restriction.Facets.OfType<XmlSchemaMaxLengthFacet>().FirstOrDefault();
                    if (maxLengthFacet != null && int.TryParse(maxLengthFacet.Value, out int len))
                    {
                        field.Length = len;
                    }

                    // Extract Example from Enum if no fixed/default
                    if (string.IsNullOrEmpty(field.ExampleValue))
                    {
                         var enumFacet = restriction.Facets.OfType<XmlSchemaEnumerationFacet>().FirstOrDefault();
                         if (enumFacet != null)
                         {
                             field.ExampleValue = enumFacet.Value;
                         }
                    }
                }
            }
            else if (element.ElementSchemaType is XmlSchemaComplexType complexType)
            {
                field.DataType = "Complex"; 
                if (!string.IsNullOrEmpty(complexType.Name)) field.DataType = complexType.Name;

                foreach (XmlSchemaAttribute attribute in complexType.AttributeUses.Values)
                {
                    var attrField = new FieldDefinition
                    {
                        Name = attribute.Name ?? attribute.RefName.Name,
                        Path = $"{field.Path}.@{attribute.Name ?? attribute.RefName.Name}",
                        DataType = attribute.SchemaTypeName.Name ?? "Attribute", 
                        ParentField = field,
                        Description = "Attribute",
                        ExampleValue = attribute.FixedValue ?? attribute.DefaultValue,
                        IsMandatory = attribute.Use == XmlSchemaUse.Required
                    };
                    fields.Add(attrField);
                }

                if (complexType.Particle != null)
                {
                    ParseParticle(complexType.Particle, fields, field);
                }
            }

            fields.Add(field);
        }

        private void ParseParticle(XmlSchemaParticle particle, List<FieldDefinition> fields, FieldDefinition parent)
        {
            if (particle is XmlSchemaSequence sequence)
            {
                foreach (XmlSchemaObject item in sequence.Items)
                {
                    if (item is XmlSchemaElement childElement)
                    {
                        ParseElement(childElement, fields, parent);
                    }
                    else if (item is XmlSchemaParticle childParticle)
                    {
                        ParseParticle(childParticle, fields, parent);
                    }
                }
            }
            else if (particle is XmlSchemaChoice choice)
            {
                foreach (XmlSchemaObject item in choice.Items)
                {
                    if (item is XmlSchemaElement childElement)
                    {
                        ParseElement(childElement, fields, parent);
                    }
                    else if (item is XmlSchemaParticle childParticle)
                    {
                        ParseParticle(childParticle, fields, parent);
                    }
                }
            }
            else if (particle is XmlSchemaAll all)
            {
                foreach (XmlSchemaElement childElement in all.Items)
                {
                    ParseElement(childElement, fields, parent);
                }
            }
            else if (particle is XmlSchemaGroupRef groupRef)
            {
                 if (groupRef.Particle != null)
                 {
                     ParseParticle(groupRef.Particle, fields, parent);
                 }
            }
        }
    }
}
