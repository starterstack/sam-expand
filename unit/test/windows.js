import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

await test('windows with no git bash', async () => {
  const log = console.error
  const mockLog = mock.fn()
  console.error = mockLog
  await assert.rejects(
    esmock('../../src/expand.js', {
      'node:os': {
        platform() {
          return 'win32'
        }
      },
      'node:process': {
        exit() {
          throw new Error('failed')
        }
      }
    })
  )
  assert.equal(mockLog.mock.callCount(), 1)
  assert.deepEqual(mockLog.mock.calls[0].arguments, [
    '\u001B[91monly git bash supported in windows!\u001B[0m'
  ])
  mock.restoreAll()
  console.error = log
})

await test('windows with git bash', async () => {
  let spawnArguments
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
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'(...arguments_) {
        spawnArguments = arguments_
      }
    })
    await expand()
  })
  assert.deepEqual(spawnArguments, ['sam', ['--help']])
})
