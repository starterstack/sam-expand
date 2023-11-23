import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

test('windows with no git bash', async (_t) => {
  await assert.rejects(async function fail() {
    const expand = await esmock('../../src/expand.js', {
      'node:os': {
        platform() {
          return 'win32'
        }
      },
      'node:process': {
        exit(code) {
          throw new Error(code)
        }
      }
    })
    await expand()
  })
})

test('windows with git bash', async (_t) => {
  let spawnArgs
  await assert.doesNotReject(async function ok() {
    const expand = await esmock('../../src/expand.js', {
      'node:os': {
        platform() {
          return 'win32'
        }
      },
      'node:process': {
        env: {
          SHELL: 'bash'
        }
      },
      async '../../src/spawn.js'(...args) {
        spawnArgs = args
      }
    })
    await expand()
  })
  assert.deepEqual(spawnArgs, ['sam', []])
})
