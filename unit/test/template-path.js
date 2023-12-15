import { test } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('template path', async (t) => {
  for (const arg of ['--template-file', '-t', '--template']) {
    await t.test(arg, async (_t) => {
      let templatePath
      const expand = await esmock.p('../../src/expand.js', {
        'node:process': {
          argv: [
            null,
            null,
            'validate',
            arg,
            path.join(__dirname, 'fixtures', 'empty.yml')
          ]
        },
        async '../../src/spawn.js'(...args) {
          templatePath = args[1][args[1].indexOf(arg) + 1]
        }
      })
      await expand()
      assert.equal(path.basename(templatePath), 'empty.yml')
    })
  }
})
