/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateMappingProfileDto } from '../models/CreateMappingProfileDto';
import type { CreateMappingProjectDto } from '../models/CreateMappingProjectDto';
import type { FieldMappingDto } from '../models/FieldMappingDto';
import type { FieldMappingSuggestionDto } from '../models/FieldMappingSuggestionDto';
import type { MappingContextDto } from '../models/MappingContextDto';
import type { MappingProfileDto } from '../models/MappingProfileDto';
import type { MappingProjectDto } from '../models/MappingProjectDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class MappingsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns MappingProjectDto OK
     * @throws ApiError
     */
    public getApiProjects(): CancelablePromise<Array<MappingProjectDto>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/projects',
        });
    }
    /**
     * @returns MappingProjectDto OK
     * @throws ApiError
     */
    public postApiProjects({
        requestBody,
    }: {
        requestBody: CreateMappingProjectDto,
    }): CancelablePromise<MappingProjectDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/projects',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns MappingProjectDto OK
     * @throws ApiError
     */
    public getApiProjects1({
        id,
    }: {
        id: string,
    }): CancelablePromise<MappingProjectDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/projects/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns MappingProfileDto OK
     * @throws ApiError
     */
    public postApiProjectsProfiles({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: CreateMappingProfileDto,
    }): CancelablePromise<MappingProfileDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/projects/{id}/profiles',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns MappingContextDto OK
     * @throws ApiError
     */
    public getApiProfilesMap({
        publicId,
    }: {
        publicId: string,
    }): CancelablePromise<MappingContextDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/profiles/{publicId}/map',
            path: {
                'publicId': publicId,
            },
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public postApiProfilesMap({
        profileId,
        requestBody,
    }: {
        profileId: string,
        requestBody: FieldMappingDto,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/profiles/{profileId}/map',
            path: {
                'profileId': profileId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public deleteApiProfilesMap({
        profileId,
        targetFieldId,
    }: {
        profileId: string,
        targetFieldId: number,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/profiles/{profileId}/map/{targetFieldId}',
            path: {
                'profileId': profileId,
                'targetFieldId': targetFieldId,
            },
        });
    }
    /**
     * @returns FieldMappingSuggestionDto OK
     * @throws ApiError
     */
    public postApiProfilesSuggest({
        profileId,
    }: {
        profileId: string,
    }): CancelablePromise<Array<FieldMappingSuggestionDto>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/profiles/{profileId}/suggest',
            path: {
                'profileId': profileId,
            },
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public getApiProfilesExportExcel({
        profileId,
    }: {
        profileId: string,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/profiles/{profileId}/export/excel',
            path: {
                'profileId': profileId,
            },
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public getApiProfilesExportCsharp({
        profileId,
    }: {
        profileId: string,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/profiles/{profileId}/export/csharp',
            path: {
                'profileId': profileId,
            },
        });
    }
    /**
     * @returns string OK
     * @throws ApiError
     */
    public getApiProfilesCodeCsharp({
        profileId,
    }: {
        profileId: string,
    }): CancelablePromise<string> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/profiles/{profileId}/code/csharp',
            path: {
                'profileId': profileId,
            },
        });
    }
}
