import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BraveSearchClient } from '../src/client.js'

test('Brave Search live smoke test (opt-in)', { skip: !process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_SEARCH_SMOKE !== '1' }, async () => {
  const client = new BraveSearchClient({ env: process.env })
  const result = await client.search('web', process.env.BRAVE_SEARCH_SMOKE_QUERY || 'DeepSeek Harness')
  assert.equal(typeof result, 'object')
})
