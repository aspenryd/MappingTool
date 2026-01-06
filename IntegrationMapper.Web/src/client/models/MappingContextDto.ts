/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataObjectExampleDto } from './DataObjectExampleDto';
import type { FieldDefinitionDto } from './FieldDefinitionDto';
import type { FieldMappingDto } from './FieldMappingDto';
export type MappingContextDto = {
    profileId?: string;
    projectId?: string;
    sourceFields?: Array<FieldDefinitionDto>;
    targetFields?: Array<any>;
    sourceExamples?: Array<DataObjectExampleDto>;
    targetExamples?: Array<any>;
    existingMappings?: Array<FieldMappingDto>;
};

