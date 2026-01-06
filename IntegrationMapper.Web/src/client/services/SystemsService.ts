/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateSystemDto } from '../models/CreateSystemDto';
import type { IntegrationSystemDto } from '../models/IntegrationSystemDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SystemsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns IntegrationSystemDto OK
     * @throws ApiError
     */
    public getApiSystems(): CancelablePromise<Array<IntegrationSystemDto>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/systems',
        });
    }
    /**
     * @returns IntegrationSystemDto OK
     * @throws ApiError
     */
    public postApiSystems({
        requestBody,
    }: {
        requestBody: CreateSystemDto,
    }): CancelablePromise<IntegrationSystemDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/systems',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns IntegrationSystemDto OK
     * @throws ApiError
     */
    public getApiSystems1({
        id,
    }: {
        id: string,
    }): CancelablePromise<IntegrationSystemDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/systems/{id}',
            path: {
                'id': id,
            },
        });
    }
}
