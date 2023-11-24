import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

test('windows with no git bash', async (_t) => {
  const log = console.error
  const mockLog = mock.fn()
  console.error = mockLog
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
  assert.equal(mockLog.mock.calls.length, 1)
  assert.deepEqual(mockLog.mock.calls[0].arguments, [
    '\x1B[91monly git bash supported in windows!\x1B[0m'
  ])
  mock.restoreAll()
  console.error = log
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
