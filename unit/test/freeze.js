import freeze from '../../src/freeze.js'
import test from 'node:test'
import assert from 'node:assert/strict'

test('simple object frozen', async () => {
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

test('nested object', async () => {
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
