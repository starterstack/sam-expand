import { test } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

await test('non windows', async () => {
  let spawnArguments
  await assert.doesNotReject(async function ok() {
    const expand = await esmock('../../src/expand.js', {
      'node:os': {
        platform() {
          return 'not win32'
        }
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'(...arguments_) {
        spawnArguments = arguments_
      }
    })
    await expand()
  })
  assert.deepEqual(spawnArguments, ['sam', ['--help']])
})
