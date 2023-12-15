import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

test('help', async (t) => {
  await t.test('sam --help', async (_t) => {
    /* c8 ignore next */
    const spawnMock = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [null, null, '--help']
      },
      async '../../src/spawn.js'(...args) {
        spawnMock(...args)
      }
    })
    await expand()
    assert.equal(spawnMock.mock.callCount(), 1)
    assert.deepEqual(spawnMock.mock.calls[0].arguments, ['sam', ['--help']])
  })
  await t.test('sam <command> --help', async (_t) => {
    /* c8 ignore next */
    const spawnMock = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [null, null, 'command', '--help']
      },
      async '../../src/spawn.js'(...args) {
        spawnMock(...args)
      }
    })
    await expand()
    assert.equal(spawnMock.mock.callCount(), 1)
    assert.deepEqual(spawnMock.mock.calls[0].arguments, [
      'sam',
      ['command', '--help']
    ])
  })
})
