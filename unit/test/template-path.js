import { test } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

await test('template path', async (t) => {
  for (const argument of ['--template-file', '-t', '--template']) {
    await t.test(argument, async () => {
      let templatePath
      const expand = await esmock.p('../../src/expand.js', {
        'node:process': {
          argv: [
            undefined,
            undefined,
            'validate',
            argument,
            path.join(__dirname, 'fixtures', 'empty.yml')
          ]
        },
        // eslint-disable-next-line @typescript-eslint/require-await
        async '../../src/spawn.js'(...arguments_) {
          templatePath = arguments_[1][arguments_[1].indexOf(argument) + 1]
        }
      })
      await expand()
      assert.equal(path.basename(templatePath), 'empty.yml')
    })
  }
})
