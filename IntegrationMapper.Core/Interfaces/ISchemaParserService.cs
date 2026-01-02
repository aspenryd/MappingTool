using IntegrationMapper.Core.Entities;

namespace IntegrationMapper.Core.Interfaces
{
    public interface ISchemaParserService
    {
        /// <summary>
        /// Parses a schema file content and returns a flat or hierarchical list of field definitions.
        /// </summary>
        /// <param name="fileContent">Raw content of the schema file</param>
        /// <param name="schemaType">Type of schema (JSON, XSD, OPENAPI)</param>
        /// <returns>List of parsed field definitions</returns>
        Task<List<FieldDefinition>> ParseSchemaAsync(Stream fileContent, string schemaType);

        /// <summary>
        /// Validates if the file content matches the expected schema type.
        /// </summary>
        bool ValidateSchema(Stream fileContent, string schemaType);
    }
}
