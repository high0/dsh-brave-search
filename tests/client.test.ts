import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { BraveSearchClient } from '../src/client.js'
import type { Config } from '../src/types.js'

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

describe('BraveSearchClient', () => {
  test('maps services, encodes params, and preserves raw JSON', async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    const client = new BraveSearchClient({
      env: { BRAVE_SEARCH_API_KEY: 'env-secret' },
      config: { apiKey: 'config-secret', baseUrl: 'https://example.test/res/' },
      fetchImpl: async (url, init) => { calls.push({ url: String(url), init }); return response({ results: [{ title: 'A&B' }] }) },
    })
    const raw = await client.search('web', 'a & b', { count: 10, spellcheck: false })
    assert.deepEqual(raw, { results: [{ title: 'A&B' }] })
    const parsed = new URL(calls[0].url)
    assert.equal(parsed.pathname, '/res/v1/web/search')
    assert.equal(parsed.searchParams.get('q'), 'a & b')
    assert.equal(parsed.searchParams.get('count'), '10')
    assert.equal(parsed.searchParams.get('spellcheck'), 'false')
    assert.equal((calls[0].init?.headers as Record<string, string>)['X-Subscription-Token'], 'env-secret')
  })

  test('maps all five endpoints', async () => {
    const paths: string[] = []
    const client = new BraveSearchClient({ env: { BRAVE_SEARCH_API_KEY: 'key' }, fetchImpl: async (url) => { paths.push(new URL(String(url)).pathname); return response({}) } })
    for (const service of ['web', 'news', 'image', 'video', 'llm_context'] as const) await client.search(service, 'x')
    assert.deepEqual(paths, ['/res/v1/web/search', '/res/v1/news/search', '/res/v1/images/search', '/res/v1/videos/search', '/res/v1/llm/context'])
  })

  test('merges defaults and rejects unknown service parameters', async () => {
    const urls: string[] = []
    const config: Config = { apiKey: 'key', defaults: { web: { count: 5, country: 'US' } } }
    const client = new BraveSearchClient({ config, fetchImpl: async (url) => { urls.push(String(url)); return response({}) } })
    await client.search('web', 'x', { count: 10 })
    assert.equal(new URL(urls[0]).searchParams.get('count'), '10')
    assert.equal(new URL(urls[0]).searchParams.get('country'), 'US')
    await assert.rejects(() => client.search('image', 'x', { freshness: 'pw' } as never), /Unknown parameter/)
  })

  test('validates query, enums, credentials, HTTP and JSON failures', async () => {
    const noKey = new BraveSearchClient({ env: {}, fetchImpl: async () => response({}) })
    await assert.rejects(() => noKey.search('web', 'x'), /API key/)
    const client = new BraveSearchClient({ env: { BRAVE_SEARCH_API_KEY: 'key' }, fetchImpl: async () => response({ message: 'bad request' }, 400) })
    await assert.rejects(() => client.search('web', 'x'), /HTTP 400: bad request/)
    const invalid = new BraveSearchClient({ env: { BRAVE_SEARCH_API_KEY: 'key' }, fetchImpl: async () => new Response('{', { status: 200 }) })
    await assert.rejects(() => invalid.search('web', 'x'), /invalid JSON/)
    await assert.rejects(() => client.search('web', ' '), /non-empty/)
    await assert.rejects(() => client.search('web', Array.from({ length: 51 }, (_, i) => `w${i}`).join(' ')), /50 words/)
    await assert.rejects(() => client.search('web', 'x', { safesearch: 'bad' } as never), /safesearch/)
  })

  test('supports cancellation and timeout', async () => {
    const client = new BraveSearchClient({ env: { BRAVE_SEARCH_API_KEY: 'key' }, config: { timeoutMs: 20 }, fetchImpl: async (_url, init) => await new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })) })
    await assert.rejects(() => client.search('web', 'x'), /timed out/)
    const controller = new AbortController()
    const cancelled = client.search('web', 'x', {}, controller.signal)
    controller.abort()
    await assert.rejects(() => cancelled, /cancelled/)
  })
})
