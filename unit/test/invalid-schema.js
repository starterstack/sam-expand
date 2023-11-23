import { test } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('invalid schema metadata', async (t) => {
  for (const { argv } of [
    {
      argv: [
        ...process.argv,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'invalid-schema.yml')
      ]
    },
    {
      argv: [
        ...process.argv,
        'validate',
        '-t',
        path.join(__dirname, 'fixtures', 'invalid-schema.yml')
      ]
    },
    {
      argv: [
        ...process.argv,
        'validate',
        '-t',
        path.join(__dirname, 'fixtures', 'invalid-schema.yml'),
        '--lint'
      ]
    }
  ]) {
    await t.test(
      `sam ${argv.slice(2).join(' ').replace(__dirname, '.')}`,
      async (_t) => {
        const expand = await esmock('../../src/expand.js', {
          'node:process': {
            argv
          }
        })
        await assert.rejects(expand, (err) => {
          assert.equal(err.message, 'schema validation failed')
          return true
        })
      }
    )
  }
})
