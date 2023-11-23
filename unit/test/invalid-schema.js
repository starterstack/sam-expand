import { test, mock } from 'node:test'
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
        const log = console.log
        const mockLog = mock.fn()
        console.log = mockLog
        const expand = await esmock('../../src/expand.js', {
          'node:process': {
            argv
          }
        })
        await assert.rejects(expand, (err) => {
          assert.equal(err.message, 'schema validation failed')
          return true
        })
        assert.equal(mockLog.mock.calls.length, 1)
        assert.deepEqual(mockLog.mock.calls[0].arguments, [
          [
            {
              context: {
                errorType: 'additionalProperties'
              },
              message: "'invalid' property is not expected to be here",
              path: '{base}.expand',
              suggestion: "Did you mean property 'config'?"
            }
          ]
        ])

        mock.restoreAll()
        console.log = log
      }
    )
  }
})
