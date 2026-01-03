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
    id: number;
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

export interface DataObject {
    id: number;
    systemId: number;
    name: string;
    schemaType: string;
    fileReference?: string;
}

export interface FieldDefinitionDto {
    id: number;
    path: string;
    name: string;
    dataType: string;
    length?: number;
    exampleValue?: string;
    description?: string;
    children?: FieldDefinitionDto[];
}

export interface FieldMappingDto {
    sourceFieldId: number | null;
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
    id: number;
    name: string;
    sourceObjectId: number;
    sourceObjectName?: string;
    targetObjectId: number;
    targetObjectName?: string;
}

export interface MappingProject {
    id: number;
    name: string;
    description: string;
    createdDate: string;
    profiles: MappingProfileDto[];
}

export interface CreateProjectDto {
    name: string;
    description: string;
}

export interface CreateMappingProfileDto {
    name: string;
    sourceObjectId: number;
    targetObjectId: number;
}

export interface MappingContextDto {
    projectId: number;
    profileId: number;
    sourceFields: FieldDefinitionDto[];
    targetFields: FieldDefinitionDto[];
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
    }
};

export const SchemaApi = {
    ingestSchema: async (systemId: number, name: string, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('SystemId', systemId.toString());
        formData.append('Name', name);
        formData.append('File', file);

        const response = await fetchWithAuth(`${API_BASE_url}/schemas/ingest`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload schema');
        return response.json();
    },

    getDataObjects: async (systemId: number): Promise<DataObject[]> => {
        const response = await fetchWithAuth(`${API_BASE_url}/schemas/system/${systemId}`);
        if (!response.ok) throw new Error('Failed to fetch data objects');
        return response.json();
    },

    downloadSchema: async (id: number, filename: string) => {
        await downloadFile(`${API_BASE_url}/schemas/${id}/content`, filename);
    },

    getSchemaContent: async (id: number): Promise<string> => {
        const response = await fetchWithAuth(`${API_BASE_url}/schemas/${id}/content`);
        if (!response.ok) throw new Error('Failed to fetch schema content');
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

    getProject: async (id: number): Promise<MappingProject> => {
        const response = await fetchWithAuth(`${API_BASE_url}/projects/${id}`);
        if (!response.ok) throw new Error('Failed to get project');
        return response.json();
    },

    getAllProjects: async (): Promise<MappingProject[]> => {
        const response = await fetchWithAuth(`${API_BASE_url}/projects`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        return response.json();
    },

    createProfile: async (projectId: number, profile: CreateMappingProfileDto): Promise<MappingProfileDto> => {
        const response = await fetchWithAuth(`${API_BASE_url}/projects/${projectId}/profiles`, {
            method: 'POST',
            body: JSON.stringify(profile),
        });
        if (!response.ok) throw new Error('Failed to create mapping profile');
        return response.json();
    }
};

export const MappingApi = {
    getMappingContext: async (profileId: number): Promise<MappingContextDto> => {
        const response = await fetchWithAuth(`${API_BASE_url}/profiles/${profileId}/map`);
        if (!response.ok) throw new Error('Failed to fetch mapping context');
        return response.json();
    },

    saveMapping: async (profileId: number, mapping: FieldMappingDto): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_url}/profiles/${profileId}/map`, {
            method: 'POST',
            body: JSON.stringify(mapping),
        });
        if (!response.ok) throw new Error('Failed to save mapping');
    },

    deleteMapping: async (profileId: number, targetFieldId: number): Promise<void> => {
        const response = await fetchWithAuth(`${API_BASE_url}/profiles/${profileId}/map/${targetFieldId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete mapping');
    },

    suggestMappings: async (profileId: number): Promise<FieldMappingSuggestionDto[]> => {
        const response = await fetchWithAuth(`${API_BASE_url}/profiles/${profileId}/suggest`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        return response.json();
    },

    exportExcel: async (profileId: number, filename: string) => {
        await downloadFile(`${API_BASE_url}/profiles/${profileId}/export/excel`, filename);
    },

    exportCSharp: async (profileId: number, filename: string) => {
        await downloadFile(`${API_BASE_url}/profiles/${profileId}/export/csharp`, filename);
    },

    getCSharpCode: async (profileId: number): Promise<string> => {
        const response = await fetchWithAuth(`${API_BASE_url}/profiles/${profileId}/code/csharp`);
        if (!response.ok) throw new Error('Failed to fetch C# code');
        return response.text();
    }
};
