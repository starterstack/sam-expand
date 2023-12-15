import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.FORCE_COLOR = '0'

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
        const log = console.error
        const mockLog = mock.fn()
        console.error = mockLog
        const expand = await esmock('../../src/expand.js', {
          'node:process': {
            argv
          }
        })
        await assert.rejects(expand, (err) => {
          assert.equal(err.message, 'schema validation failed')
          return true
        })
        assert.equal(mockLog.mock.callCount(), 1)
        assert.deepEqual(mockLog.mock.calls[0].arguments, [
          'ADDTIONAL PROPERTY must NOT have additional properties\n' +
            '\n' +
            '  1 | {\n' +
            '  2 |   "expand": {\n' +
            '> 3 |     "invalid": true\n' +
            '    |     ^^^^^^^^^ 😲  invalid is not expected to be here!\n' +
            '  4 |   }\n' +
            '  5 | }'
        ])

        mock.restoreAll()
        console.error = log
      }
    )
  }
})
