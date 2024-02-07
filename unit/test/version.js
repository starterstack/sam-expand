import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

await test('version', async (t) => {
  await t.test('sam --version', async () => {
    /* c8 ignore next */
    const spawnMock = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [undefined, undefined, '--version']
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'(...arguments_) {
        spawnMock(...arguments_)
      }
    })
    await expand()
    assert.equal(spawnMock.mock.callCount(), 1)
    assert.deepEqual(spawnMock.mock.calls[0].arguments, ['sam', ['--version']])
  })
})
