import { test, mock } from 'node:test'
import esmock from 'esmock'

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

await test('typescript resolver with typescript import', async () => {
  const expand = await esmock.p('../../src/expand.js', {
    'node:process': {
      argv: [
        undefined,
        undefined,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'ts-resolver-with-import.yml')
      ]
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async '../../src/spawn.js'() {}
  })
  await expand()
})

await test('typescript resolver with no typescript import fails schema validation', async () => {
  /* c8 ignore next */
  console.error = mock.fn()
  const expand = await esmock.p('../../src/expand.js', {
    'node:process': {
      argv: [
        undefined,
        undefined,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'ts-resolver-with-no-import.yml')
      ]
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async '../../src/spawn.js'() {}
  })

  await assert.rejects(expand, { message: 'schema validation failed' })
  mock.restoreAll()
})
