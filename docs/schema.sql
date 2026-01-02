-- Azure SQL Schema for Integration Mapper

CREATE TABLE IntegrationSystems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ExternalId VARCHAR(255),
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(1000),
    Category NVARCHAR(100) -- e.g., 'CRM', 'ERP', 'Legacy'
);

CREATE TABLE DataObjects (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SystemId INT NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    SchemaType NVARCHAR(50) NOT NULL, -- 'JSON', 'XSD', 'OPENAPI'
    FileReference NVARCHAR(2048), -- URL to Azure Blob Storage
    CONSTRAINT FK_DataObjects_IntegrationSystems FOREIGN KEY (SystemId) REFERENCES IntegrationSystems(Id)
);

CREATE TABLE FieldDefinitions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DataObjectId INT NOT NULL,
    ParentFieldId INT,
    Path NVARCHAR(500) NOT NULL, -- Dot notation: 'Customer.Address.City'
    Name NVARCHAR(255) NOT NULL,
    DataType NVARCHAR(50), -- 'String', 'Integer', 'Date', etc.
    ExampleValue NVARCHAR(MAX),
    CONSTRAINT FK_FieldDefinitions_DataObjects FOREIGN KEY (DataObjectId) REFERENCES DataObjects(Id),
    CONSTRAINT FK_FieldDefinitions_Parent FOREIGN KEY (ParentFieldId) REFERENCES FieldDefinitions(Id)
);

CREATE TABLE MappingProjects (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    SourceObjectId INT NOT NULL,
    TargetObjectId INT NOT NULL,
    CreatedDate DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_MappingProjects_Source FOREIGN KEY (SourceObjectId) REFERENCES DataObjects(Id),
    CONSTRAINT FK_MappingProjects_Target FOREIGN KEY (TargetObjectId) REFERENCES DataObjects(Id)
);

CREATE TABLE FieldMappings (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId INT NOT NULL,
    SourceFieldId INT, -- Nullable if it's a constant or calculated field
    TargetFieldId INT NOT NULL,
    TransformationLogic NVARCHAR(MAX), -- e.g., Javascript snippet, or JSON logic
    ConfidenceScore FLOAT, -- For AI suggestions
    CONSTRAINT FK_FieldMappings_Project FOREIGN KEY (ProjectId) REFERENCES MappingProjects(Id),
    CONSTRAINT FK_FieldMappings_Source FOREIGN KEY (SourceFieldId) REFERENCES FieldDefinitions(Id),
    CONSTRAINT FK_FieldMappings_Target FOREIGN KEY (TargetFieldId) REFERENCES FieldDefinitions(Id)
);

-- Indexing for performance
CREATE INDEX IX_FieldDefinitions_DataObjectId ON FieldDefinitions(DataObjectId);
CREATE INDEX IX_FieldMappings_ProjectId ON FieldMappings(ProjectId);
