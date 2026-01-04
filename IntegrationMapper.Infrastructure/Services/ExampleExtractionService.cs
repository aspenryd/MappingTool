using IntegrationMapper.Core.Entities;
using IntegrationMapper.Core.Interfaces;
using System.Text.Json;
using System.Xml.Linq;

namespace IntegrationMapper.Infrastructure.Services
{
    public class ExampleExtractionService : IExampleExtractionService
    {
        public async Task<Dictionary<string, List<string>>> ExtractExampleValuesAsync(Stream fileContent, string schemaType, List<FieldDefinition> fields)
        {
            var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

            try
            {
                if (fileContent.CanSeek) fileContent.Position = 0;

                if (string.Equals(schemaType, "JSON", StringComparison.OrdinalIgnoreCase))
                {
                    await ExtractJsonAsync(fileContent, result);
                }
                else if (string.Equals(schemaType, "XSD", StringComparison.OrdinalIgnoreCase))
                {
                   await ExtractXmlAsync(fileContent, result);
                }
            }
            catch (Exception ex)
            {
                // Log or ignore errors during extraction to prevent breaking the flow
                Console.WriteLine($"Error extracting examples: {ex.Message}");
            }

            return result;
        }

        private async Task ExtractJsonAsync(Stream stream, Dictionary<string, List<string>> result)
        {
            using var doc = await JsonDocument.ParseAsync(stream);
            TraverseJson(doc.RootElement, "$", result);
        }

        private void TraverseJson(JsonElement element, string currentPath, Dictionary<string, List<string>> result)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    foreach (var prop in element.EnumerateObject())
                    {
                        var newPath = currentPath == "$" ? prop.Name : $"{currentPath}.{prop.Name}";
                        TraverseJson(prop.Value, newPath, result);
                    }
                    break;
                
                case JsonValueKind.Array:
                    foreach (var item in element.EnumerateArray())
                    {
                        // Array items share the same path as the array property for primitives, 
                        // or continue traversal for objects (where the path continues from the array property)
                        // If it's an array of primitives, we want the values at 'currentPath'
                        if (item.ValueKind != JsonValueKind.Object && item.ValueKind != JsonValueKind.Array)
                        {
                             AddValue(result, currentPath, item.ToString());
                        }
                        else
                        {
                            // If object, recurse with SAME path (schema usually defined as Prop.Child)
                            // The schema parser handles arrays by *ignoring* the index step in naming children?
                            // Checked SchemaParser: `ParseElement(firstItem, currentPath + "[*]", ...)`
                            // But usually, data references are flat: `orders.id`
                            // So if I have `orders: [{id:1}]`, I want `orders.id` -> 1.
                            // My `currentPath` is `orders`.
                            // Recurse with `orders`.
                            TraverseJson(item, currentPath, result);
                        }
                    }
                    break;

                case JsonValueKind.String:
                case JsonValueKind.Number:
                case JsonValueKind.True:
                case JsonValueKind.False:
                     AddValue(result, currentPath, element.ToString());
                     break;
            }
        }

        private async Task ExtractXmlAsync(Stream stream, Dictionary<string, List<string>> result)
        {
            // Reset position if needed, XDocument.Load uses it.
            // Actually XDocument.LoadAsync takes stream.
            var doc = await XDocument.LoadAsync(stream, LoadOptions.None, CancellationToken.None);
            if (doc.Root != null)
            {
                TraverseXml(doc.Root, doc.Root.Name.LocalName, result);
            }
        }

        private void TraverseXml(XElement element, string currentPath, Dictionary<string, List<string>> result)
        {
            // If element has no elements (leaf), add value
            if (!element.HasElements)
            {
                if (!string.IsNullOrWhiteSpace(element.Value))
                {
                    AddValue(result, currentPath, element.Value);
                }
            }

            // Attributes
            foreach (var attr in element.Attributes())
            {
                AddValue(result, $"{currentPath}.@{attr.Name.LocalName}", attr.Value);
            }

            // Children
            foreach (var child in element.Elements())
            {
                TraverseXml(child, $"{currentPath}.{child.Name.LocalName}", result);
            }
        }

        private void AddValue(Dictionary<string, List<string>> result, string path, string value)
        {
            if (!result.ContainsKey(path))
            {
                result[path] = new List<string>();
            }
            if (result[path].Count < 3 && !result[path].Contains(value)) // Limit to 3 unique examples
            {
                result[path].Add(value);
            }
        }
    }
}
