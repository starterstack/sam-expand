import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

test('non windows', async (_t) => {
  let spawnArgs
  await assert.doesNotReject(async function ok() {
    const expand = await esmock('../../src/expand.js', {
      'node:os': {
        platform() {
          return 'not win32'
        }
      },
      async '../../src/spawn.js'(...args) {
        spawnArgs = args
      }
    })
    await expand()
  })
  assert.deepEqual(spawnArgs, ['sam', ['--help']])
})
