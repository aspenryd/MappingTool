using IntegrationMapper.Core.DTOs;

namespace IntegrationMapper.Core.Interfaces
{
    public interface IMappingService
    {
        Task<MappingContextDto> GetMappingContextAsync(int projectId);
        Task SaveMappingAsync(int projectId, FieldMappingDto mapping);
    }
}
