import freeze from '../../src/freeze.js'
import test from 'node:test'
import assert from 'node:assert/strict'

await test('simple object frozen', () => {
  const object = {
    a: 42
  }
  const frozen = freeze(object)

  assert.throws(() => {
    frozen.a++
  })
  assert.throws(() => {
    frozen.b = 'new property!'
  })
})

await test('nested object', () => {
  const object = {
    a: {
      b: {
        c: {
          d: {
            x: 42
          }
        }
      }
    }
  }
  const frozen = freeze(object)

  assert.throws(() => {
    frozen.a.b.c.d.x++
  })
  assert.throws(() => {
    frozen.b = 'new property!'
  })
})
