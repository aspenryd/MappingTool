using System.IO;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IntegrationMapper.Core.Interfaces
{
    public interface ISchemaValidatorService
    {
        /// <summary>
        /// Validates an example file against a schema.
        /// </summary>
        /// <param name="schemaStream">The schema content (JSON Schema or XSD).</param>
        /// <param name="schemaType">"JSON" or "XSD".</param>
        /// <param name="exampleStream">The example file content.</param>
        /// <returns>A list of validation error messages. Empty if valid.</returns>
        Task<List<string>> ValidateExampleAsync(Stream schemaStream, string schemaType, Stream exampleStream);
    }
}
