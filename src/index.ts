import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { BraveSearchClient } from './client.js'
import type { Config as ConfigType, JsonObject } from './types.js'

export const name = 'dsh-brave-search'
export const inject = ['tools']
export type { BraveService, BraveSearchArgs, BraveSearchError, JsonObject } from './types.js'
export interface Config extends ConfigType {}

const optionalString = () => Schema.string()
const searchDefaults = () => Schema.object({
  country: optionalString(), search_lang: optionalString(), ui_lang: optionalString(), count: Schema.number(), offset: Schema.number(), freshness: optionalString(), safesearch: optionalString(), spellcheck: Schema.boolean(), extra_snippets: Schema.boolean(), goggles: optionalString(),
})

export const Config: Schema<Config> = Schema.object({
  apiKey: optionalString(),
  baseUrl: optionalString().default('https://api.search.brave.com/res'),
  timeoutMs: Schema.number().default(30000),
  defaults: Schema.object({
    web: searchDefaults(), news: searchDefaults(), image: Schema.object({ country: optionalString(), search_lang: optionalString(), count: Schema.number(), safesearch: optionalString(), spellcheck: Schema.boolean() }), video: searchDefaults(), llm_context: Schema.object({ country: optionalString(), search_lang: optionalString(), count: Schema.number(), freshness: optionalString(), maximum_number_of_urls: Schema.number(), maximum_number_of_tokens: Schema.number(), maximum_number_of_snippets: Schema.number(), maximum_number_of_tokens_per_url: Schema.number(), maximum_number_of_snippets_per_url: Schema.number(), context_threshold_mode: optionalString(), safesearch: optionalString(), enable_local: Schema.boolean(), enable_rich_callback: Schema.boolean() }),
  }),
})

export function apply(ctx: Context, config: Config): void {
  const client = new BraveSearchClient({ config })
  ctx.tools.register(defineTool({
    name: 'brave_search',
    description: 'Search the web, news, images, videos, or retrieve LLM context using the Brave Search API.',
    parameters: {
      service: { type: 'string', enum: ['web', 'news', 'image', 'video', 'llm_context'], required: true, description: 'Brave service to call.' },
      query: { type: 'string', required: true, description: 'Search query (up to 400 characters and 50 words).' },
      params: { type: 'object', additionalProperties: true, description: 'Optional service-specific Brave query parameters.' },
    },
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    timeoutMs: config.timeoutMs,
    async execute(args, exec) {
      return client.search(args.service, args.query, (args.params ?? {}) as JsonObject, exec.signal)
    },
  }))
}
