namespace IntegrationMapper.Core.DTOs
{
    // ================
    // User Management
    // ================

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    public class CreateUserDto
    {
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
    }

    public class UpdateUserRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }

    // ================
    // Batch Operations
    // ================

    public class BatchUploadResultDto
    {
        public int SuccessCount { get; set; }
        public int ErrorCount { get; set; }
        public List<string> Errors { get; set; } = new();
    }

    // Batch systems (reuses CreateSystemDto items)
    public class BatchSystemsUploadDto
    {
        public List<CreateSystemDto> Systems { get; set; } = new();
    }

    // Batch data objects with schemas/examples
    public class BatchDataObjectDto
    {
        public Guid SystemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SchemaType { get; set; } = "json"; // json, xml, xsd
        public string? SchemaContent { get; set; }
        public List<string>? ExampleContents { get; set; }
    }

    public class BatchDataObjectsUploadDto
    {
        public List<BatchDataObjectDto> DataObjects { get; set; } = new();
    }

    // Batch mapping projects
    public class BatchMappingDto
    {
        public string SourceFieldPath { get; set; } = string.Empty;
        public string TargetFieldPath { get; set; } = string.Empty;
        public string? TransformationLogic { get; set; }
    }

    public class BatchMappingProfileDto
    {
        public string Name { get; set; } = string.Empty;
        public string SourceObjectName { get; set; } = string.Empty;
        public string TargetObjectName { get; set; } = string.Empty;
        public List<BatchMappingDto> Mappings { get; set; } = new();
    }

    public class BatchMappingProjectDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string SourceSystemExternalId { get; set; } = string.Empty;
        public string TargetSystemExternalId { get; set; } = string.Empty;
        public List<BatchMappingProfileDto> Profiles { get; set; } = new();
    }

    public class BatchProjectsUploadDto
    {
        public List<BatchMappingProjectDto> Projects { get; set; } = new();
    }
}
