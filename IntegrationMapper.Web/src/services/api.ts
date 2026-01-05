export const API_BASE_url = '/api';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    // Ensure Content-Type is set if body is present and not FormData
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const config = {
        ...options,
        headers
    };

    return fetch(url, config);
};

const downloadFile = async (url: string, filename: string) => {
    const response = await fetchWithAuth(url);
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


// --- Interfaces ---

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
        const response = await fetchWithAuth(`${API_BASE_url}/systems`);
        if (!response.ok) throw new Error('Failed to fetch systems');
        return response.json();
    },

    createSystem: async (system: CreateSystemDto): Promise<IntegrationSystem> => {
        const response = await fetchWithAuth(`${API_BASE_url}/systems`, {
            method: 'POST',
            body: JSON.stringify(system),
        });
        if (!response.ok) throw new Error('Failed to create system');
        return response.json();
    },

    getSystem: async (id: string): Promise<IntegrationSystem> => {
        const response = await fetchWithAuth(`${API_BASE_url}/systems/${id}`);
        if (!response.ok) throw new Error('Failed to fetch system');
        return response.json();
    }
};

export const SchemaApi = {
    ingestSchema: async (systemId: string, name: string, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('SystemPublicId', systemId);
        formData.append('Name', name);
        formData.append('File', file);

        const response = await fetchWithAuth(`${API_BASE_url}/schemas/ingest`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload schema');
        return response.json();
    },

    getDataObjects: async (systemId: string): Promise<DataObject[]> => {
        const response = await fetchWithAuth(`${API_BASE_url}/schemas/system/${systemId}`);
        if (!response.ok) throw new Error('Failed to fetch data objects');
        return response.json();
    },

    downloadSchema: async (id: string, filename: string) => {
        await downloadFile(`${API_BASE_url}/schemas/${id}/content`, filename);
    },

    getSchemaContent: async (id: string): Promise<string> => {
        const response = await fetchWithAuth(`${API_BASE_url}/schemas/${id}/content`);
        if (!response.ok) throw new Error('Failed to fetch schema content');
        return response.text();
    },

    uploadExample: async (dataObjectId: string, file: File): Promise<DataObjectExampleDto> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetchWithAuth(`${API_BASE_url}/schemas/data-objects/${dataObjectId}/examples`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to upload example');
        return response.json();
    },

    deleteExample: async (exampleId: string): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_url}/schemas/examples/${exampleId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete example');
    },

    getExampleContent: async (exampleId: string): Promise<string> => {
        const response = await fetchWithAuth(`${API_BASE_url}/schemas/examples/${exampleId}/content`);
        if (!response.ok) throw new Error('Failed to fetch example content');
        return response.text();
    }
};

export const ProjectApi = {
    createProject: async (project: CreateProjectDto): Promise<MappingProject> => {
        const response = await fetchWithAuth(`${API_BASE_url}/projects`, {
            method: 'POST',
            body: JSON.stringify(project),
        });
        if (!response.ok) throw new Error('Failed to create project');
        return response.json();
    },

    getDetail: async (id: string): Promise<MappingProject> => {
        const response = await fetchWithAuth(`${API_BASE_url}/projects/${id}`);
        if (!response.ok) throw new Error('Failed to get project');
        return response.json();
    },

    // Legacy method - remove or alias to getDetail since id is publicId now
    getByPublicId: async (publicId: string): Promise<MappingProject> => {
        return ProjectApi.getDetail(publicId);
    },

    getAllProjects: async (): Promise<MappingProject[]> => {
        const response = await fetchWithAuth(`${API_BASE_url}/projects`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        return response.json();
    },

    createProfile: async (projectId: string, profile: CreateMappingProfileDto): Promise<MappingProfileDto> => {
        const response = await fetchWithAuth(`${API_BASE_url}/projects/${projectId}/profiles`, {
            method: 'POST',
            body: JSON.stringify(profile),
        });
        if (!response.ok) throw new Error('Failed to create mapping profile');
        return response.json();
    }
};

export const MappingApi = {
    getMappingContext: async (profileId: string): Promise<MappingContextDto> => {
        const response = await fetchWithAuth(`${API_BASE_url}/profiles/${profileId}/map`);
        if (!response.ok) throw new Error('Failed to fetch mapping context');
        return response.json();
    },

    // Legacy alias
    getMappingContextByPublicId: async (publicId: string): Promise<MappingContextDto> => {
        return MappingApi.getMappingContext(publicId);
    },

    saveMapping: async (profileId: string, mapping: FieldMappingDto): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_url}/profiles/${profileId}/map`, {
            method: 'POST',
            body: JSON.stringify(mapping),
        });
        if (!response.ok) throw new Error('Failed to save mapping');
    },

    deleteMapping: async (profileId: string, targetFieldId: number): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_url}/profiles/${profileId}/map/${targetFieldId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete mapping');
    },

    suggestMappings: async (profileId: string): Promise<FieldMappingSuggestionDto[]> => {
        const response = await fetchWithAuth(`${API_BASE_url}/profiles/${profileId}/suggest`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        return response.json();
    },

    exportExcel: async (profileId: string, filename: string) => {
        await downloadFile(`${API_BASE_url}/profiles/${profileId}/export/excel`, filename);
    },

    exportCSharp: async (profileId: string, filename: string) => {
        await downloadFile(`${API_BASE_url}/profiles/${profileId}/export/csharp`, filename);
    },

    getCSharpCode: async (profileId: string): Promise<string> => {
        const response = await fetchWithAuth(`${API_BASE_url}/profiles/${profileId}/code/csharp`);
        if (!response.ok) throw new Error('Failed to fetch C# code');
        return response.text();
    }
};
