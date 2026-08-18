import type { BraveService, Config, JsonObject, JsonValue } from './types.js';
export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
declare const ENDPOINTS: Record<BraveService, string>;
declare const PARAMS: Record<BraveService, readonly string[]>;
declare const DEFAULT_BASE_URL = "https://api.search.brave.com/res";
declare const DEFAULT_TIMEOUT_MS = 30000;
export interface BraveClientOptions {
    config?: Config;
    env?: NodeJS.ProcessEnv;
    fetchImpl?: FetchLike;
}
export declare class BraveSearchClient {
    readonly apiKey?: string;
    readonly baseUrl: string;
    readonly timeoutMs: number;
    private readonly defaults;
    private readonly fetchImpl;
    constructor(options?: BraveClientOptions);
    search(service: BraveService, query: string, params?: JsonObject, signal?: AbortSignal): Promise<JsonValue>;
    validateService(service: unknown): asserts service is BraveService;
    validateQuery(query: unknown): asserts query is string;
    validateParams(service: BraveService, params: Record<string, unknown>): void;
    private validateNumber;
    private stringifyParam;
}
export { DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS, ENDPOINTS, PARAMS };
//# sourceMappingURL=client.d.ts.map