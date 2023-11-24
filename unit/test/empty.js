import { test } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('empty template with no metadata', async (t) => {
  for (const { expected, argv } of [
    {
      expected: ['sam', []],
      argv: [...process.argv]
    },
    {
      expected: ['sam', ['--help']],
      argv: [...process.argv, '--help']
    },
    {
      expected: [
        'sam',
        ['build', '-t', path.join(__dirname, 'fixtures', 'empty.expanded.yml')]
      ],
      argv: [
        ...process.argv,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'empty.yml')
      ]
    },
    {
      expected: [
        'sam',
        ['validate', '-t', path.join(__dirname, 'fixtures', 'empty.yml')]
      ],
      argv: [
        ...process.argv,
        'validate',
        '-t',
        path.join(__dirname, 'fixtures/empty.yml')
      ]
    },
    {
      expected: [
        'sam',
        [
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'empty.yml'),
          '--lint'
        ]
      ],
      argv: [
        ...process.argv,
        'validate',
        '-t',
        path.join(__dirname, 'fixtures', 'empty.yml'),
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
            argv
          },
          async '../../src/spawn.js'(...args) {
            spawnArgs = args
          }
        })
        await expand()
        assert.deepEqual(spawnArgs, expected)
      }
    )
  }
})
