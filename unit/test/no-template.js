import { test } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

await test('no template', async (_t) => {
  const expand = await esmock.p('../../src/expand.js', {
    'node:process': {
      env: {
        INIT_CWD: path.join(__dirname, 'fixtures', 'empty')
      },
      argv: [null, null, 'build']
    }
  })
  await assert.rejects(expand(), { message: 'no template file found' })
})
