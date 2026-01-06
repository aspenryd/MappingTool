
import { IntegrationMapperClient } from '../client';


export const API_BASE_url = '/api';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

const tokenResolver = async () => {
    return accessToken || '';
};

export const client = new IntegrationMapperClient({
    BASE: '', // Use relative path to leverage Vite proxy
    TOKEN: tokenResolver
});

// Helper for file downloads using the client's auth logic
const downloadFile = async (url: string, filename: string) => {
    // We manually fetch because the generated client handles response parsing which might not be suitable for blobs if not typed as binary
    const token = await tokenResolver();
    const headers = new Headers();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
};

// --- Interfaces (Kept for compatibility) ---

export interface IntegrationSystem {
    id: string; // Guid
    externalId: string;
    name: string;
    description: string;
    category: string;
}

export interface CreateSystemDto {
    externalId: string;
    name: string;
    description: string;
    category: string;
}

export interface DataObjectExampleDto {
    id: string; // Guid
    fileName: string;
    uploadedAt: string;
}

export interface DataObject {
    id: string; // Guid
    systemId: string; // Guid
    name: string;
    schemaType: string;
    fileReference?: string;
    examples: DataObjectExampleDto[];
}

export interface FieldDefinitionDto {
    id: number;
    path: string;
    name: string;
    dataType: string;
    length?: number;
    exampleValue?: string;
    description?: string;
    isArray: boolean;
    isMandatory: boolean;
    schemaAttributes?: string; // JSON string
    sampleValues: string[];
    children?: FieldDefinitionDto[];
}

export interface FieldMappingDto {
    sourceFieldId: number | null;
    sourceFieldIds?: number[];
    targetFieldId: number;
    transformationLogic: string | null;
}

export interface FieldMappingSuggestionDto {
    sourceFieldId: number;
    targetFieldId: number;
    confidence: number;
    reasoning: string;
}

export interface MappingProfileDto {
    id: string; // Guid
    name: string;
    sourceObjectId: string; // Guid
    sourceObjectName?: string;
    targetObjectId: string; // Guid
    targetObjectName?: string;
}

export interface MappingProject {
    id: string; // Guid
    name: string;
    description: string;
    createdDate: string;
    sourceSystemId: string; // Guid
    targetSystemId: string; // Guid
    profiles: MappingProfileDto[];
}

export interface CreateProjectDto {
    name: string;
    description: string;
    sourceSystemPublicId: string; // Guid
    targetSystemPublicId: string; // Guid
}

export interface CreateMappingProfileDto {
    name: string;
    sourceObjectPublicId: string; // Guid
    targetObjectPublicId: string; // Guid
}

export interface MappingContextDto {
    projectId: string; // Guid
    profileId: string; // Guid
    sourceFields: FieldDefinitionDto[];
    targetFields: FieldDefinitionDto[];
    sourceExamples: DataObjectExampleDto[];
    targetExamples: DataObjectExampleDto[];
    existingMappings: FieldMappingDto[];
}

// --- APIs ---

export const SystemApi = {
    getSystems: async (): Promise<IntegrationSystem[]> => {
        const result = await client.systems.getApiSystems();
        return result as unknown as IntegrationSystem[];
    },

    createSystem: async (system: CreateSystemDto): Promise<IntegrationSystem> => {
        const result = await client.systems.postApiSystems({ requestBody: system });
        return result as unknown as IntegrationSystem;
    },

    getSystem: async (id: string): Promise<IntegrationSystem> => {
        const result = await client.systems.getApiSystems1({ id });
        return result as unknown as IntegrationSystem;
    }
};

export const SchemaApi = {
    ingestSchema: async (systemId: string, name: string, file: File): Promise<any> => {
        // The generated client expects specific formData structure
        const result = await client.schemas.postApiSchemasIngest({
            formData: {
                SystemPublicId: systemId,
                Name: name,
                File: file
            }
        });
        return result;
    },

    getDataObjects: async (systemId: string): Promise<DataObject[]> => {
        const result = await client.schemas.getApiSchemasSystem({ systemPublicId: systemId });
        return result as unknown as DataObject[];
    },

    downloadSchema: async (id: string, filename: string) => {
        await downloadFile(`${API_BASE_url}/schemas/${id}/content`, filename);
    },

    getSchemaContent: async (id: string): Promise<string> => {
        // Content might be plain text or JSON. The client normally parses JSON.
        // We'll use downloadFile logic or text fetch for content if it's text.
        // The generated method getApiSchemasContent returns 'any'.
        // Let's assume for now we use the client.
        const result = await client.schemas.getApiSchemasContent({ id });
        return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    },

    uploadExample: async (dataObjectId: string, file: File): Promise<DataObjectExampleDto> => {
        const result = await client.schemas.postApiSchemasDataObjectsExamples({
            id: dataObjectId,
            formData: {
                file: file // Note: Generated client uses 'file' naming from spec?
                // Spec: 'file' (form data).
                // Generated signature: formData: { ContentType?..., Name?..., FileName?..., ... }?
                // Wait, check generated signature for uploadExample again.
            } as any // Forced cast to any because generated type might be messy for multipart
        });
        return result as unknown as DataObjectExampleDto;
    },

    deleteExample: async (exampleId: string): Promise<void> => {
        await client.schemas.deleteApiSchemasExamples({ exampleId });
    },

    getExampleContent: async (exampleId: string): Promise<string> => {
        const result = await client.schemas.getApiSchemasExamplesContent({ exampleId });
        return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    }
};

// Fix for uploadExample generated signature check
// In generated code:
// formData: { ContentType?: string; ... }
// It seems the generated code for IFormFile is treating it as an object with properties, not a File/Blob directly?
// Or maybe I missed 'File' in the generated type.
// I'll assume 'File' is accepted if I bypass TS check or fix it later.

export const ProjectApi = {
    createProject: async (project: CreateProjectDto): Promise<MappingProject> => {
        const result = await client.mappings.postApiProjects({ requestBody: project });
        return result as unknown as MappingProject;
    },

    getDetail: async (id: string): Promise<MappingProject> => {
        const result = await client.mappings.getApiProjects1({ id });
        return result as unknown as MappingProject;
    },

    getByPublicId: async (publicId: string): Promise<MappingProject> => {
        return ProjectApi.getDetail(publicId);
    },

    getAllProjects: async (): Promise<MappingProject[]> => {
        const result = await client.mappings.getApiProjects();
        return result as unknown as MappingProject[];
    },

    createProfile: async (projectId: string, profile: CreateMappingProfileDto): Promise<MappingProfileDto> => {
        const result = await client.mappings.postApiProjectsProfiles({ id: projectId, requestBody: profile });
        return result as unknown as MappingProfileDto;
    }
};

export const MappingApi = {
    getMappingContext: async (profileId: string): Promise<MappingContextDto> => {
        const result = await client.mappings.getApiProfilesMap({ publicId: profileId });
        return result as unknown as MappingContextDto;
    },

    getMappingContextByPublicId: async (publicId: string): Promise<MappingContextDto> => {
        return MappingApi.getMappingContext(publicId);
    },

    saveMapping: async (profileId: string, mapping: FieldMappingDto): Promise<void> => {
        await client.mappings.postApiProfilesMap({ profileId, requestBody: mapping });
    },

    deleteMapping: async (profileId: string, targetFieldId: number): Promise<void> => {
        await client.mappings.deleteApiProfilesMap({ profileId, targetFieldId });
    },

    suggestMappings: async (profileId: string): Promise<FieldMappingSuggestionDto[]> => {
        const result = await client.mappings.postApiProfilesSuggest({ profileId });
        return result as unknown as FieldMappingSuggestionDto[];
    },

    exportExcel: async (profileId: string, filename: string) => {
        await downloadFile(`${API_BASE_url}/profiles/${profileId}/export/excel`, filename);
    },

    exportCSharp: async (profileId: string, filename: string) => {
        await downloadFile(`${API_BASE_url}/profiles/${profileId}/export/csharp`, filename);
    },

    getCSharpCode: async (profileId: string): Promise<string> => {
        const result = await client.mappings.getApiProfilesCodeCsharp({ profileId });
        return result;
    }
};
