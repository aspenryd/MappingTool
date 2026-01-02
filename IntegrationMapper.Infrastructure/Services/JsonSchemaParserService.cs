using IntegrationMapper.Core.Entities;
using IntegrationMapper.Core.Interfaces;
using System.Text.Json;

namespace IntegrationMapper.Infrastructure.Services
{
    public class JsonSchemaParserService : ISchemaParserService
    {
        public async Task<List<FieldDefinition>> ParseSchemaAsync(Stream fileContent, string schemaType)
        {
            if (!ValidateSchema(fileContent, schemaType))
            {
                throw new ArgumentException("Invalid schema type or content");
            }

            var fieldDefinitions = new List<FieldDefinition>();
            
            try 
            {
                using var document = await JsonDocument.ParseAsync(fileContent);
                ParseElement(document.RootElement, "$", fieldDefinitions, null);
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException("Failed to parse JSON content", ex);
            }

            return fieldDefinitions;
        }

        public bool ValidateSchema(Stream fileContent, string schemaType)
        {
            return schemaType.Equals("JSON", StringComparison.OrdinalIgnoreCase);
        }

        private void ParseElement(JsonElement element, string currentPath, List<FieldDefinition> fields, FieldDefinition parent)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    // 1. JSON Schema "properties" (standard schema)
                    if (element.TryGetProperty("properties", out var propertiesElement) && propertiesElement.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var property in propertiesElement.EnumerateObject())
                        {
                            var newPath = currentPath == "$" ? property.Name : $"{currentPath}.{property.Name}";
                            
                            // Try to get type from the schema definition
                            string dataType = "Object";
                            if (property.Value.TryGetProperty("type", out var typeProp))
                            {
                                dataType = typeProp.ToString();
                            }
                            else if (property.Value.ValueKind == JsonValueKind.Object)
                            {
                                // Infer
                                dataType = "Object"; 
                            }

                            var field = new FieldDefinition
                            {
                                Name = property.Name,
                                Path = newPath,
                                DataType = dataType,
                                ParentField = parent
                            };

                            // Check for "example", "default", "description"
                            if (property.Value.TryGetProperty("example", out var exampleProp))
                            {
                                field.ExampleValue = exampleProp.ToString();
                            }
                            else if (property.Value.TryGetProperty("default", out var defaultProp))
                            {
                                field.ExampleValue = defaultProp.ToString();
                            }

                            if (property.Value.TryGetProperty("description", out var descProp))
                            {
                                field.Description = descProp.ToString();
                            }

                            fields.Add(field);

                            // Recurse into the schema definition for this property
                            // This recursively handles nested "properties"
                            ParseElement(property.Value, newPath, fields, field);
                        }
                        return; // Successfully parsed as Schema Object
                    }

                    // 2. JSON Schema "items" (array schema)
                    if (element.TryGetProperty("items", out var itemsElement))
                    {
                        // The current element describes an array. We are already inside the array processing via recursion usually.
                        // But if we are here, we might need to describe the *items*.
                        // However, usually we don't create fields for the array logic itself in this flattener, 
                        // we just want to discover nested fields.
                        ParseElement(itemsElement, currentPath + "[*]", fields, parent);
                        return;
                    }

                    // 3. Schema Leaf (has "type" but no properties/items - e.g. primitive definition)
                    if (element.TryGetProperty("type", out _))
                    {
                        // It's a schema definition for a primitive or leaf. 
                        // We have already created the field for THIS element in the parent loop.
                        // We do NOT want to parse "type", "description" etc. as child fields.
                        return;
                    }

                    // 4. Fallback: Naive Object (Example JSON or unknown structure)
                    foreach (var property in element.EnumerateObject())
                    {
                        // Filter out metadata keys like $schema
                        if (property.Name.StartsWith("$")) continue;

                        var newPath = currentPath == "$" ? property.Name : $"{currentPath}.{property.Name}";
                        
                        var field = new FieldDefinition
                        {
                            Name = property.Name,
                            Path = newPath,
                            DataType = property.Value.ValueKind.ToString(),
                            ParentField = parent
                        };
                        
                        if (IsPrimitive(property.Value.ValueKind))
                        {
                            field.ExampleValue = property.Value.ToString();
                        }

                        fields.Add(field);
                        ParseElement(property.Value, newPath, fields, field);
                    }
                    break;

                case JsonValueKind.Array:
                    if (element.GetArrayLength() > 0)
                    {
                        var firstItem = element[0];
                        ParseElement(firstItem, currentPath + "[*]", fields, parent);
                    }
                    else 
                    {
                         // Empty array, check if it's a schema array definition? 
                         // (Handled effectively by Object case above if "items" was present in parent)
                    }
                    break;
            }
        }

        private bool IsPrimitive(JsonValueKind kind)
        {
            return kind == JsonValueKind.String || 
                   kind == JsonValueKind.Number || 
                   kind == JsonValueKind.True || 
                   kind == JsonValueKind.False;
        }
    }
}
