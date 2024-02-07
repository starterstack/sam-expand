import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

await test('plugin lifecycles', async (t) => {
  for (const command of ['validate', 'build', 'package', 'deploy', 'delete']) {
    await t.test(command, async () => {
      let getMetadataConfig
      let getSchema
      const mockLifecycle = mock.fn()
      const expand = await esmock.p('../../src/expand.js', {
        [path.join(__dirname, 'fixtures', 'do-nothing-plugin.mjs')]: {
          get metadataConfig() {
            getMetadataConfig = 'do-nothing'
            return getMetadataConfig
          },
          get schema() {
            getSchema = {
              type: 'object',
              nullable: true,
              additionalProperties: false
            }
            return getSchema
          },
          // eslint-disable-next-line @typescript-eslint/require-await
          async lifecycle(plugin) {
            return mockLifecycle(plugin)
          }
        },
        'node:process': {
          argv: [
            undefined,
            undefined,
            command,
            '-t',
            path.join(__dirname, 'fixtures', 'region.yml')
          ]
        },
        // eslint-disable-next-line @typescript-eslint/require-await
        async '../../src/spawn.js'() {}
      })
      await expand()
      assert.equal(getMetadataConfig, 'do-nothing')
      assert.deepEqual(getSchema, {
        type: 'object',
        nullable: true,
        additionalProperties: false
      })
      if (command === 'validate') {
        assert.equal(mockLifecycle.mock.callCount(), 1)
        assert.equal(
          mockLifecycle.mock.calls[0].arguments[0].lifecycle,
          'expand'
        )
      } else {
        assert.equal(mockLifecycle.mock.callCount(), 3)
        assert.deepEqual(
          mockLifecycle.mock.calls.map((c) => c.arguments[0].lifecycle),
          ['expand', `pre:${command}`, `post:${command}`]
        )
      }
      mock.restoreAll()
    })
  }
})
