using IntegrationMapper.Core.DTOs;

namespace IntegrationMapper.Core.Interfaces
{
    public interface IMappingService
    {
        Task<MappingContextDto> GetMappingContextAsync(Guid projectId);
        Task SaveMappingAsync(Guid projectId, FieldMappingDto mapping);
    }
}
