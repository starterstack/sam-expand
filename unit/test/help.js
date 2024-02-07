import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

await test('help', async (t) => {
  await t.test('sam --help', async () => {
    /* c8 ignore next */
    const spawnMock = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [undefined, undefined, '--help']
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'(...arguments_) {
        spawnMock(...arguments_)
      }
    })
    await expand()
    assert.equal(spawnMock.mock.callCount(), 1)
    assert.deepEqual(spawnMock.mock.calls[0].arguments, ['sam', ['--help']])
  })
  await t.test('sam <command> --help', async () => {
    /* c8 ignore next */
    const spawnMock = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [undefined, undefined, 'command', '--help']
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'(...arguments_) {
        spawnMock(...arguments_)
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
