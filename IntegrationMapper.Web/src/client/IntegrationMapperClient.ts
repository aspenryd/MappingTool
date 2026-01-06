/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { DevAuthService } from './services/DevAuthService';
import { MappingsService } from './services/MappingsService';
import { SchemasService } from './services/SchemasService';
import { SystemsService } from './services/SystemsService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class IntegrationMapperClient {
    public readonly devAuth: DevAuthService;
    public readonly mappings: MappingsService;
    public readonly schemas: SchemasService;
    public readonly systems: SystemsService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? 'http://localhost:5000',
            VERSION: config?.VERSION ?? '1.0.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.devAuth = new DevAuthService(this.request);
        this.mappings = new MappingsService(this.request);
        this.schemas = new SchemasService(this.request);
        this.systems = new SystemsService(this.request);
    }
}

