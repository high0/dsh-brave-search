export const SERVICES = ['web', 'news', 'image', 'video', 'llm_context'] as const
export type BraveService = (typeof SERVICES)[number]

export type JsonObject = { [key: string]: JsonValue }
export type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject

export interface SearchDefaults {
  country?: string
  search_lang?: string
  ui_lang?: string
  count?: number
  offset?: number
  freshness?: string
  safesearch?: string
  spellcheck?: boolean
  extra_snippets?: boolean
  goggles?: string
}

export interface ImageSearchDefaults {
  country?: string
  search_lang?: string
  count?: number
  safesearch?: string
  spellcheck?: boolean
}

export interface LlmContextDefaults {
  country?: string
  search_lang?: string
  count?: number
  freshness?: string
  maximum_number_of_urls?: number
  maximum_number_of_tokens?: number
  maximum_number_of_snippets?: number
  maximum_number_of_tokens_per_url?: number
  maximum_number_of_snippets_per_url?: number
  context_threshold_mode?: string
  safesearch?: string
  enable_local?: boolean
  enable_rich_callback?: boolean
}

export interface Config {
  apiKey?: string
  baseUrl?: string
  timeoutMs?: number
  defaults?: {
    web?: SearchDefaults
    news?: SearchDefaults
    image?: ImageSearchDefaults
    video?: SearchDefaults
    llm_context?: LlmContextDefaults
  }
}

export interface BraveSearchArgs {
  service: BraveService
  query: string
  params?: JsonObject
}

export class BraveSearchError extends Error {
  readonly code: string
  readonly service?: BraveService
  readonly status?: number

  constructor(code: string, message: string, options: { service?: BraveService; status?: number } = {}) {
    super(message)
    this.name = 'BraveSearchError'
    this.code = code
    this.service = options.service
    this.status = options.status
  }
}
