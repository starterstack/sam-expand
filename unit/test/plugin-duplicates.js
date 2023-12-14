import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('plugin duplicates', async (t) => {
  for (const command of ['validate', 'build', 'package', 'deploy', 'delete']) {
    await t.test(command, async (_t) => {
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
          }
        },
        'node:process': {
          argv: [
            null,
            null,
            command,
            '-t',
            path.join(__dirname, 'fixtures', 'plugin-duplicates.yml')
          ]
        },
        async '../../src/spawn.js'() {}
      })
      await assert.rejects(
        expand(),
        'Error: duplicate config do-nothing found in plugin'
      )
      mock.restoreAll()
    })
  }
})
