import type {
  IntegrationSystemDto,
  CreateSystemDto,
  DataObjectDto,
  MappingProjectDto,
  CreateMappingProjectDto,
  CreateMappingProfileDto,
  MappingProfileDto,
  MappingContextDto,
  FieldMappingDto,
  FieldMappingSuggestionDto,
  SchemaUploadResponseDto,
  DataObjectExampleDto,
} from './types'

class ApiClient {
  private baseUrl = ''
  private getToken: (() => string | null) | null = null

  setTokenGetter(getter: () => string | null) {
    this.getToken = getter
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken?.()
    const headers: HeadersInit = {
      ...options.headers,
    }

    if (token) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    if (
      options.body &&
      !(options.body instanceof FormData) &&
      typeof options.body === 'string'
    ) {
      ;(headers as Record<string, string>)['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `HTTP error ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json()
    }

    return response.text() as unknown as T
  }

  private async downloadFile(endpoint: string, filename: string): Promise<void> {
    const token = this.getToken?.()
    const headers: HeadersInit = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers })
    if (!response.ok) throw new Error('Download failed')

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(downloadUrl)
  }

  // Systems API
  systems = {
    getAll: () => this.request<IntegrationSystemDto[]>('/api/systems'),

    getById: (id: string) =>
      this.request<IntegrationSystemDto>(`/api/systems/${id}`),

    create: (data: CreateSystemDto) =>
      this.request<IntegrationSystemDto>('/api/systems', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  }

  // Schemas API
  schemas = {
    getDataObjects: (systemPublicId: string) =>
      this.request<DataObjectDto[]>(`/api/schemas/system/${systemPublicId}`),

    ingest: async (
      systemPublicId: string,
      name: string,
      file: File
    ): Promise<SchemaUploadResponseDto> => {
      const formData = new FormData()
      formData.append('SystemPublicId', systemPublicId)
      formData.append('Name', name)
      formData.append('File', file)

      return this.request<SchemaUploadResponseDto>('/api/schemas/ingest', {
        method: 'POST',
        body: formData,
      })
    },

    getContent: (id: string) =>
      this.request<string>(`/api/schemas/${id}/content`),

    downloadContent: (id: string, filename: string) =>
      this.downloadFile(`/api/schemas/${id}/content`, filename),

    uploadExample: async (
      dataObjectId: string,
      file: File
    ): Promise<DataObjectExampleDto> => {
      const formData = new FormData()
      formData.append('file', file)

      return this.request<DataObjectExampleDto>(
        `/api/schemas/data-objects/${dataObjectId}/examples`,
        {
          method: 'POST',
          body: formData,
        }
      )
    },

    getExampleContent: (exampleId: string) =>
      this.request<string>(`/api/schemas/examples/${exampleId}/content`),

    deleteExample: (exampleId: string) =>
      this.request<void>(`/api/schemas/examples/${exampleId}`, {
        method: 'DELETE',
      }),
  }

  // Projects API
  projects = {
    getAll: () => this.request<MappingProjectDto[]>('/api/projects'),

    getById: (id: string) =>
      this.request<MappingProjectDto>(`/api/projects/${id}`),

    create: (data: CreateMappingProjectDto) =>
      this.request<MappingProjectDto>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    createProfile: (projectId: string, data: CreateMappingProfileDto) =>
      this.request<MappingProfileDto>(`/api/projects/${projectId}/profiles`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  }

  // Mappings API
  mappings = {
    getContext: (profileId: string) =>
      this.request<MappingContextDto>(`/api/profiles/${profileId}/map`),

    saveMapping: (profileId: string, data: FieldMappingDto) =>
      this.request<void>(`/api/profiles/${profileId}/map`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteMapping: (profileId: string, targetFieldId: number) =>
      this.request<void>(`/api/profiles/${profileId}/map/${targetFieldId}`, {
        method: 'DELETE',
      }),

    suggest: (profileId: string) =>
      this.request<FieldMappingSuggestionDto[]>(
        `/api/profiles/${profileId}/suggest`,
        { method: 'POST' }
      ),

    getCSharpCode: (profileId: string) =>
      this.request<string>(`/api/profiles/${profileId}/code/csharp`),

    exportCSharp: (profileId: string, filename: string) =>
      this.downloadFile(`/api/profiles/${profileId}/export/csharp`, filename),

    exportExcel: (profileId: string, filename: string) =>
      this.downloadFile(`/api/profiles/${profileId}/export/excel`, filename),
  }
}

export const apiClient = new ApiClient()
