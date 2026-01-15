import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type {
  CreateSystemDto,
  CreateMappingProjectDto,
  CreateMappingProfileDto,
  FieldMappingDto,
} from './types'

// Query Keys
export const queryKeys = {
  systems: {
    all: ['systems'] as const,
    detail: (id: string) => ['systems', id] as const,
    dataObjects: (systemId: string) => ['systems', systemId, 'dataObjects'] as const,
  },
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
  },
  mappings: {
    context: (profileId: string) => ['mappings', profileId, 'context'] as const,
  },
}

// Systems Hooks
export function useSystems() {
  return useQuery({
    queryKey: queryKeys.systems.all,
    queryFn: () => apiClient.systems.getAll(),
  })
}

export function useSystem(id: string) {
  return useQuery({
    queryKey: queryKeys.systems.detail(id),
    queryFn: () => apiClient.systems.getById(id),
    enabled: !!id,
  })
}

export function useCreateSystem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSystemDto) => apiClient.systems.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systems.all })
    },
  })
}

// Data Objects Hooks
export function useDataObjects(systemPublicId: string) {
  return useQuery({
    queryKey: queryKeys.systems.dataObjects(systemPublicId),
    queryFn: () => apiClient.schemas.getDataObjects(systemPublicId),
    enabled: !!systemPublicId,
  })
}

export function useIngestSchema() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      systemPublicId,
      name,
      file,
    }: {
      systemPublicId: string
      name: string
      file: File
    }) => apiClient.schemas.ingest(systemPublicId, name, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.systems.dataObjects(variables.systemPublicId),
      })
    },
  })
}

export function useUploadExample() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      dataObjectId,
      file,
    }: {
      dataObjectId: string
      file: File
      systemPublicId: string
    }) => apiClient.schemas.uploadExample(dataObjectId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.systems.dataObjects(variables.systemPublicId),
      })
    },
  })
}

export function useDeleteExample() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      exampleId,
    }: {
      exampleId: string
      systemPublicId: string
    }) => apiClient.schemas.deleteExample(exampleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.systems.dataObjects(variables.systemPublicId),
      })
    },
  })
}

// Projects Hooks
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: () => apiClient.projects.getAll(),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => apiClient.projects.getById(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMappingProjectDto) =>
      apiClient.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string
      data: CreateMappingProfileDto
    }) => apiClient.projects.createProfile(projectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.projectId),
      })
    },
  })
}

// Mapping Hooks
export function useMappingContext(profileId: string) {
  return useQuery({
    queryKey: queryKeys.mappings.context(profileId),
    queryFn: () => apiClient.mappings.getContext(profileId),
    enabled: !!profileId,
  })
}

export function useSaveMapping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      profileId,
      data,
    }: {
      profileId: string
      data: FieldMappingDto
    }) => apiClient.mappings.saveMapping(profileId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.mappings.context(variables.profileId),
      })
    },
  })
}

export function useDeleteMapping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      profileId,
      targetFieldId,
    }: {
      profileId: string
      targetFieldId: number
    }) => apiClient.mappings.deleteMapping(profileId, targetFieldId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.mappings.context(variables.profileId),
      })
    },
  })
}

export function useSuggestMappings() {
  return useMutation({
    mutationFn: (profileId: string) => apiClient.mappings.suggest(profileId),
  })
}
