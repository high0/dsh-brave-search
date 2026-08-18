import { BraveSearchError, SERVICES } from './types.js';
const ENDPOINTS = {
    web: '/v1/web/search',
    news: '/v1/news/search',
    image: '/v1/images/search',
    video: '/v1/videos/search',
    llm_context: '/v1/llm/context',
};
const PARAMS = {
    web: ['country', 'search_lang', 'ui_lang', 'count', 'offset', 'freshness', 'safesearch', 'spellcheck', 'extra_snippets', 'goggles'],
    news: ['country', 'search_lang', 'ui_lang', 'count', 'offset', 'freshness', 'safesearch', 'spellcheck', 'extra_snippets', 'goggles'],
    image: ['country', 'search_lang', 'count', 'safesearch', 'spellcheck'],
    video: ['country', 'search_lang', 'ui_lang', 'count', 'offset', 'freshness', 'safesearch', 'spellcheck', 'extra_snippets', 'goggles'],
    llm_context: ['country', 'search_lang', 'count', 'freshness', 'maximum_number_of_urls', 'maximum_number_of_tokens', 'maximum_number_of_snippets', 'maximum_number_of_tokens_per_url', 'maximum_number_of_snippets_per_url', 'context_threshold_mode', 'safesearch', 'enable_local', 'enable_rich_callback'],
};
const DEFAULT_BASE_URL = 'https://api.search.brave.com/res';
const DEFAULT_TIMEOUT_MS = 30_000;
export class BraveSearchClient {
    apiKey;
    baseUrl;
    timeoutMs;
    defaults;
    fetchImpl;
    constructor(options = {}) {
        const config = options.config ?? {};
        const env = options.env ?? process.env;
        this.apiKey = env.BRAVE_SEARCH_API_KEY || config.apiKey;
        this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
        this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) {
            throw new BraveSearchError('INVALID_CONFIG', 'timeoutMs must be a positive finite number');
        }
        this.defaults = config.defaults ?? {};
        this.fetchImpl = options.fetchImpl ?? fetch;
    }
    async search(service, query, params = {}, signal) {
        this.validateService(service);
        this.validateQuery(query);
        const merged = { ...(this.defaults[service] ?? {}), ...params };
        this.validateParams(service, merged);
        if (!this.apiKey)
            throw new BraveSearchError('MISSING_API_KEY', 'Brave Search API key is not configured', { service });
        const url = new URL(`${this.baseUrl}${ENDPOINTS[service]}`);
        url.searchParams.set('q', query);
        for (const [key, value] of Object.entries(merged)) {
            if (value !== undefined && value !== null)
                url.searchParams.set(key, this.stringifyParam(value));
        }
        const controller = new AbortController();
        const onAbort = () => controller.abort(signal?.reason);
        if (signal) {
            if (signal.aborted)
                throw new BraveSearchError('CANCELLED', 'Brave Search request was cancelled', { service });
            signal.addEventListener('abort', onAbort, { once: true });
        }
        const timer = setTimeout(() => controller.abort(new Error('timeout')), this.timeoutMs);
        try {
            let response;
            try {
                response = await this.fetchImpl(url, {
                    method: 'GET',
                    headers: { Accept: 'application/json', 'X-Subscription-Token': this.apiKey },
                    signal: controller.signal,
                });
            }
            catch (error) {
                if (signal?.aborted)
                    throw new BraveSearchError('CANCELLED', 'Brave Search request was cancelled', { service });
                if (controller.signal.aborted)
                    throw new BraveSearchError('TIMEOUT', `Brave Search ${service} request timed out`, { service });
                const detail = error instanceof Error ? error.message : 'network request failed';
                throw new BraveSearchError('FETCH_FAILED', `Brave Search ${service} request failed: ${detail}`, { service });
            }
            if (!response.ok) {
                let summary = '';
                try {
                    const body = await response.json();
                    summary = safeErrorSummary(body);
                }
                catch { /* non-JSON error bodies are handled by status alone */ }
                throw new BraveSearchError('HTTP_ERROR', `Brave Search ${service} returned HTTP ${response.status}${summary ? `: ${summary}` : ''}`, { service, status: response.status });
            }
            try {
                return await response.json();
            }
            catch {
                throw new BraveSearchError('INVALID_JSON', `Brave Search ${service} returned invalid JSON`, { service, status: response.status });
            }
        }
        finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
        }
    }
    validateService(service) {
        if (typeof service !== 'string' || !SERVICES.includes(service)) {
            throw new BraveSearchError('INVALID_SERVICE', `service must be one of: ${SERVICES.join(', ')}`);
        }
    }
    validateQuery(query) {
        if (typeof query !== 'string' || query.trim().length === 0)
            throw new BraveSearchError('INVALID_QUERY', 'query must be a non-empty string');
        if ([...query].length > 400)
            throw new BraveSearchError('INVALID_QUERY', 'query must be at most 400 characters');
        if (query.trim().split(/\s+/u).filter(Boolean).length > 50)
            throw new BraveSearchError('INVALID_QUERY', 'query must contain at most 50 words');
    }
    validateParams(service, params) {
        if (!params || typeof params !== 'object' || Array.isArray(params))
            throw new BraveSearchError('INVALID_PARAMS', 'params must be an object', { service });
        const allowed = new Set(PARAMS[service]);
        for (const [key, value] of Object.entries(params)) {
            if (!allowed.has(key))
                throw new BraveSearchError('INVALID_PARAMS', `Unknown parameter "${key}" for ${service}`, { service });
            if (value === undefined)
                continue;
            if (['country', 'search_lang', 'ui_lang', 'freshness', 'goggles', 'context_threshold_mode'].includes(key) && typeof value !== 'string')
                throw new BraveSearchError('INVALID_PARAMS', `${key} must be a string`, { service });
            if (['spellcheck', 'extra_snippets', 'enable_local', 'enable_rich_callback'].includes(key) && typeof value !== 'boolean')
                throw new BraveSearchError('INVALID_PARAMS', `${key} must be a boolean`, { service });
            if (['count', 'offset', 'maximum_number_of_urls', 'maximum_number_of_tokens', 'maximum_number_of_snippets', 'maximum_number_of_tokens_per_url', 'maximum_number_of_snippets_per_url'].includes(key))
                this.validateNumber(key, value, service);
            if (key === 'safesearch' && !['off', 'moderate', 'strict'].includes(String(value)))
                throw new BraveSearchError('INVALID_PARAMS', 'safesearch must be off, moderate, or strict', { service });
            if (key === 'freshness' && !/^(pd|pw|pm|py|\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2})$/u.test(String(value)))
                throw new BraveSearchError('INVALID_PARAMS', 'freshness must be pd, pw, pm, py, or a YYYY-MM-DDtoYYYY-MM-DD range', { service });
            if (key === 'context_threshold_mode' && !['strict', 'balanced', 'lenient', 'disabled'].includes(String(value)))
                throw new BraveSearchError('INVALID_PARAMS', 'context_threshold_mode must be strict, balanced, lenient, or disabled', { service });
        }
    }
    validateNumber(key, value, service) {
        if (typeof value !== 'number' || !Number.isInteger(value))
            throw new BraveSearchError('INVALID_PARAMS', `${key} must be an integer`, { service });
        let min = 0;
        let max = 100;
        if (key === 'offset')
            max = 9;
        else if (key === 'count') {
            min = 1;
            max = service === 'image' ? 200 : service === 'video' ? 50 : 20;
        }
        else if (key === 'maximum_number_of_urls') {
            min = 1;
            max = 50;
        }
        else if (key === 'maximum_number_of_tokens') {
            min = 1024;
            max = 32768;
        }
        else if (key === 'maximum_number_of_snippets') {
            min = 1;
            max = 256;
        }
        else if (key === 'maximum_number_of_tokens_per_url') {
            min = 512;
            max = 8192;
        }
        else if (key === 'maximum_number_of_snippets_per_url') {
            min = 1;
            max = 100;
        }
        if (value < min || value > max)
            throw new BraveSearchError('INVALID_PARAMS', `${key} must be within the supported range`, { service });
    }
    stringifyParam(value) {
        if (typeof value === 'boolean')
            return value ? 'true' : 'false';
        return String(value);
    }
}
function safeErrorSummary(value) {
    if (!value || typeof value !== 'object')
        return '';
    const object = value;
    const candidate = object.message ?? object.error ?? object.detail;
    return typeof candidate === 'string' ? candidate.slice(0, 300).replace(/[\r\n]+/gu, ' ') : '';
}
export { DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS, ENDPOINTS, PARAMS };
//# sourceMappingURL=client.js.map