export const SERVICES = ['web', 'news', 'image', 'video', 'llm_context'];
export class BraveSearchError extends Error {
    code;
    service;
    status;
    constructor(code, message, options = {}) {
        super(message);
        this.name = 'BraveSearchError';
        this.code = code;
        this.service = options.service;
        this.status = options.status;
    }
}
//# sourceMappingURL=types.js.map