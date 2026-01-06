/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MappingProfileDto } from './MappingProfileDto';
export type MappingProjectDto = {
    id?: string;
    name?: string;
    description?: string;
    sourceSystemId?: string;
    targetSystemId?: string;
    createdDate?: string;
    profiles?: Array<MappingProfileDto>;
};

