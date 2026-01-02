export const API_BASE_url = '/api';

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
}

export interface FieldDefinitionDto {
    id: number;
    path: string;
    name: string;
    dataType: string;
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

export interface MappingProject {
    id: number;
    name: string;
    sourceObjectId: number;
    targetObjectId: number;
    createdDate: string;
}

export interface CreateProjectDto {
    name: string;
    sourceObjectId: number;
    targetObjectId: number;
}

export interface MappingContextDto {
    projectId: number;
    sourceFields: FieldDefinitionDto[];
    targetFields: FieldDefinitionDto[];
    existingMappings: FieldMappingDto[];
}

// --- APIs ---

export const SystemApi = {
    getSystems: async (): Promise<IntegrationSystem[]> => {
        const response = await fetch(`${API_BASE_url}/systems`);
        if (!response.ok) throw new Error('Failed to fetch systems');
        return response.json();
    },

    createSystem: async (system: CreateSystemDto): Promise<IntegrationSystem> => {
        const response = await fetch(`${API_BASE_url}/systems`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

        const response = await fetch(`${API_BASE_url}/schemas/ingest`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload schema');
        return response.json();
    },

    getDataObjects: async (systemId: number): Promise<DataObject[]> => {
        const response = await fetch(`${API_BASE_url}/schemas/system/${systemId}`);
        if (!response.ok) throw new Error('Failed to fetch data objects');
        return response.json();
    }
};

export const ProjectApi = {
    createProject: async (project: CreateProjectDto): Promise<MappingProject> => {
        const response = await fetch(`${API_BASE_url}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project),
        });
        if (!response.ok) throw new Error('Failed to create project');
        return response.json();
    },

    getProject: async (id: number): Promise<MappingProject> => {
        const response = await fetch(`${API_BASE_url}/projects/${id}`);
        if (!response.ok) throw new Error('Failed to get project');
        return response.json();
    },

    getAllProjects: async (): Promise<MappingProject[]> => {
        const response = await fetch(`${API_BASE_url}/projects`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        return response.json();
    }
};

export const MappingApi = {
    getMappingContext: async (projectId: number): Promise<MappingContextDto> => {
        const response = await fetch(`${API_BASE_url}/projects/${projectId}/map`);
        if (!response.ok) throw new Error('Failed to fetch mapping context');
        return response.json();
    },

    saveMapping: async (projectId: number, mapping: FieldMappingDto): Promise<void> => {
        const response = await fetch(`${API_BASE_url}/projects/${projectId}/map`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapping),
        });
        if (!response.ok) throw new Error('Failed to save mapping');
    },

    suggestMappings: async (projectId: number): Promise<FieldMappingSuggestionDto[]> => {
        const response = await fetch(`${API_BASE_url}/projects/${projectId}/suggest`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        return response.json();
    }
};
