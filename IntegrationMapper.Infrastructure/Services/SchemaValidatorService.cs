using IntegrationMapper.Core.Interfaces;
using NJsonSchema;
using System.Xml;
using System.Xml.Schema;
using System.Text;

namespace IntegrationMapper.Infrastructure.Services
{
    public class SchemaValidatorService : ISchemaValidatorService
    {
        public async Task<List<string>> ValidateExampleAsync(Stream schemaStream, string schemaType, Stream exampleStream)
        {
            if (string.Equals(schemaType, "JSON", StringComparison.OrdinalIgnoreCase))
            {
                return await ValidateJsonAsync(schemaStream, exampleStream);
            }
            else if (string.Equals(schemaType, "XSD", StringComparison.OrdinalIgnoreCase))
            {
                return ValidateXsd(schemaStream, exampleStream);
            }

            return new List<string> { $"Unsupported schema type: {schemaType}" };
        }

        private async Task<List<string>> ValidateJsonAsync(Stream schemaStream, Stream exampleStream)
        {
            var errors = new List<string>();
            try
            {
                // Reset streams if needed, NJsonSchema reads them.
                if (schemaStream.CanSeek) schemaStream.Position = 0;
                if (exampleStream.CanSeek) exampleStream.Position = 0;

                // Load Schema
                // NJsonSchema.JsonSchema.FromJsonAsync reads string usually, but we have stream.
                using var schemaReader = new StreamReader(schemaStream, leaveOpen: true);
                var schemaJson = await schemaReader.ReadToEndAsync();
                var schema = await JsonSchema.FromJsonAsync(schemaJson);

                // Load Example JSON
                using var exampleReader = new StreamReader(exampleStream, leaveOpen: true);
                var exampleJson = await exampleReader.ReadToEndAsync();

                // Validate
                var validationErrors = schema.Validate(exampleJson);

                foreach (var error in validationErrors)
                {
                    errors.Add($"{error.Path}: {error.Kind} - {error.Property}");
                }
            }
            catch (Exception ex)
            {
                errors.Add($"JSON Validation Exception: {ex.Message}");
            }
            return errors;
        }

        private List<string> ValidateXsd(Stream schemaStream, Stream exampleStream)
        {
            var errors = new List<string>();
            try
            {
                if (schemaStream.CanSeek) schemaStream.Position = 0;
                if (exampleStream.CanSeek) exampleStream.Position = 0;

                var settings = new XmlReaderSettings();
                settings.ValidationType = ValidationType.Schema;
                
                // Add schema
                using var schemaReader = XmlReader.Create(schemaStream);
                settings.Schemas.Add(null, schemaReader);

                settings.ValidationEventHandler += (sender, args) =>
                {
                    errors.Add($"{args.Severity}: {args.Message} (Line {args.Exception.LineNumber}, Pos {args.Exception.LinePosition})");
                };

                using var exampleReader = XmlReader.Create(exampleStream, settings);
                while (exampleReader.Read()) { } // Read to trigger validation
            }
            catch (Exception ex)
            {
                errors.Add($"XSD Validation Exception: {ex.Message}");
            }
            return errors;
        }
    }
}
