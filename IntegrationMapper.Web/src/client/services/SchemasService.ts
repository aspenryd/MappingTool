/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataObjectDto } from '../models/DataObjectDto';
import type { DataObjectExampleDto } from '../models/DataObjectExampleDto';
import type { SchemaUploadResponseDto } from '../models/SchemaUploadResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SchemasService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns SchemaUploadResponseDto OK
     * @throws ApiError
     */
    public postApiSchemasIngest({
        formData,
    }: {
        formData: {
            SystemPublicId?: string;
            Name?: string;
            File?: Blob;
        },
    }): CancelablePromise<SchemaUploadResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/schemas/ingest',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
        });
    }
    /**
     * @returns DataObjectDto OK
     * @throws ApiError
     */
    public getApiSchemasSystem({
        systemPublicId,
    }: {
        systemPublicId: string,
    }): CancelablePromise<Array<DataObjectDto>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/schemas/system/{systemPublicId}',
            path: {
                'systemPublicId': systemPublicId,
            },
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public getApiSchemasContent({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/schemas/{id}/content',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns DataObjectExampleDto OK
     * @throws ApiError
     */
    public postApiSchemasDataObjectsExamples({
        id,
        formData,
    }: {
        id: string,
        formData: {
            ContentType?: string;
            ContentDisposition?: string;
            Headers?: Record<string, Array<any>>;
            Length?: number;
            Name?: string;
            FileName?: string;
        },
    }): CancelablePromise<DataObjectExampleDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/schemas/data-objects/{id}/examples',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public getApiSchemasExamplesContent({
        exampleId,
    }: {
        exampleId: string,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/schemas/examples/{exampleId}/content',
            path: {
                'exampleId': exampleId,
            },
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public deleteApiSchemasExamples({
        exampleId,
    }: {
        exampleId: string,
    }): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/schemas/examples/{exampleId}',
            path: {
                'exampleId': exampleId,
            },
        });
    }
}
