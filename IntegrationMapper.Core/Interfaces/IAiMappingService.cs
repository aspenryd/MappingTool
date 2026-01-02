using IntegrationMapper.Core.DTOs;

namespace IntegrationMapper.Core.Interfaces
{
    public interface IAiMappingService
    {
        Task<List<FieldMappingSuggestionDto>> SuggestMappingsAsync(List<FieldDefinitionDto> sourceFields, List<FieldDefinitionDto> targetFields);
    }
}
