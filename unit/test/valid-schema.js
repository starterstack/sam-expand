import { test } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'

import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('valid schema metadata', async (t) => {
  for (const { expected, argv } of [
    {
      expected: [
        'sam',
        [
          'build',
          '-t',
          path.join(__dirname, 'fixtures', 'valid-schema.expanded.yml')
        ]
      ],
      argv: [
        ...process.argv,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'valid-schema.yml')
      ]
    },
    {
      expected: [
        'sam',
        ['validate', '-t', path.join(__dirname, 'fixtures', 'valid-schema.yml')]
      ],
      argv: [
        ...process.argv,
        'validate',
        '-t',
        path.join(__dirname, 'fixtures', 'valid-schema.yml')
      ]
    },
    {
      expected: [
        'sam',
        [
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'valid-schema.yml'),
          '--lint'
        ]
      ],
      argv: [
        ...process.argv,
        'validate',
        '-t',
        path.join(__dirname, 'fixtures', 'valid-schema.yml'),
        '--lint'
      ]
    }
  ]) {
    await t.test(
      `sam ${argv.slice(2).join(' ').replace(__dirname, '.')}`,
      async (_t) => {
        let spawnArgs
        const expand = await esmock('../../src/expand.js', {
          'node:process': {
            argv,
            env: {
              INIT_CWD: __dirname
            }
          },
          async '../../src/spawn.js'(...args) {
            spawnArgs = args
          }
        })
        await assert.doesNotReject(expand)
        assert.deepEqual(expected, spawnArgs)
      }
    )
  }
})
