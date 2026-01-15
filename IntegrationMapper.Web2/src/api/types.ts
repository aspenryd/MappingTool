// API Types based on OpenAPI specification

export interface IntegrationSystemDto {
  id: string
  externalId?: string
  name?: string
  description?: string
  category?: string
}

export interface CreateSystemDto {
  externalId?: string
  name?: string
  description?: string
  category?: string
}

export interface DataObjectExampleDto {
  id: string
  fileName?: string
  uploadedAt?: string
}

export interface DataObjectDto {
  id: string
  systemPublicId: string
  name?: string
  schemaType?: string
  fileReference?: string
  examples?: DataObjectExampleDto[]
}

export interface FieldDefinitionDto {
  id: number
  path?: string
  name?: string
  dataType?: string
  length?: number | null
  isArray: boolean
  isMandatory: boolean
  schemaAttributes?: string | null
  description?: string
  exampleValue?: string
  sampleValues?: string[]
  children?: FieldDefinitionDto[]
}

export interface FieldMappingDto {
  sourceFieldId?: number | null
  targetFieldId: number
  transformationLogic?: string | null
  sourceFieldIds?: number[]
}

export interface FieldMappingSuggestionDto {
  sourceFieldId: number
  targetFieldId: number
  confidence: number
  reasoning?: string
}

export interface MappingProfileDto {
  id: string
  name?: string
  sourceObjectId: string
  sourceObjectName?: string
  targetObjectId: string
  targetObjectName?: string
}

export interface MappingProjectDto {
  id: string
  name?: string
  description?: string
  sourceSystemId: string
  targetSystemId: string
  createdDate?: string
  profiles?: MappingProfileDto[]
}

export interface CreateMappingProjectDto {
  name?: string
  description?: string
  sourceSystemId?: string
  sourceSystemPublicId: string
  targetSystemPublicId: string
}

export interface CreateMappingProfileDto {
  name?: string
  sourceObjectPublicId: string
  targetObjectPublicId: string
}

export interface MappingContextDto {
  profileId: string
  projectId: string
  sourceFields?: FieldDefinitionDto[]
  targetFields?: FieldDefinitionDto[]
  sourceExamples?: DataObjectExampleDto[]
  targetExamples?: DataObjectExampleDto[]
  existingMappings?: FieldMappingDto[]
}

export interface SchemaUploadResponseDto {
  dataObjectPublicId: string
  name?: string
  fieldCount: number
}
