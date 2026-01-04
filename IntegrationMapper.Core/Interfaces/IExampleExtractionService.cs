using IntegrationMapper.Core.Entities;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace IntegrationMapper.Core.Interfaces
{
    public interface IExampleExtractionService
    {
        Task<Dictionary<string, List<string>>> ExtractExampleValuesAsync(Stream fileContent, string schemaType, List<FieldDefinition> fields);
    }
}
