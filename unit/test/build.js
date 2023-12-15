import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('use build config', async (t) => {
  for (const command of ['package', 'deploy']) {
    await t.test('use .aws-sam/build template', async (_t) => {
      const mockLifecycle = mock.fn()
      const expand = await esmock.p('../../src/expand.js', {
        [path.join(__dirname, 'fixtures', 'build', 'do-nothing-plugin.mjs')]: {
          async lifecycle(plugin) {
            return mockLifecycle(plugin)
          }
        },
        'node:process': {
          env: {
            INIT_CWD: path.join(__dirname, 'fixtures', 'build')
          },
          argv: [null, null, command]
        },
        async '../../src/spawn.js'() {}
      })
      await expand()
      assert.equal(mockLifecycle.mock.callCount(), 3)
      assert.deepEqual(
        [
          ...new Set(
            mockLifecycle.mock.calls.map(
              (x) => x.arguments[0].template.Metadata.assert
            )
          )
        ],
        ['built by .aws-sam fixture :)']
      )
      assert.deepEqual(
        mockLifecycle.mock.calls.map((x) => x.arguments[0].lifecycle),
        ['expand', `pre:${command}`, `post:${command}`]
      )
      for (const template of mockLifecycle.mock.calls.map(
        (x) => x.arguments[0].template
      )) {
        assert.throws(() => {
          template.Metadata.assert = 'read only!'
        })
      }
      mock.restoreAll()
    })
  }
})
