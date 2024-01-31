import { test } from 'node:test'
import assert from 'node:assert/strict'
import shouldInline from '../../src/plugins/should-inline-parameter-value.js'

test('inline parameter values', async (t) => {
  await t.test('simple value', () => {
    assert.equal(shouldInline('no need'), false)
  })
  await t.test('largest value', () => {
    assert.equal(shouldInline('n'.repeat(4096)), false)
  })
  await t.test('too large value', () => {
    assert.equal(shouldInline('n'.repeat(4097)), true)
  })
  await t.test('quotes', () => {
    assert.equal(shouldInline("'"), true)
    assert.equal(shouldInline('"'), true)
  })
  await t.test('line breaks', () => {
    assert.equal(shouldInline('\n'), true)
    assert.equal(shouldInline('\r'), true)
  })
})
