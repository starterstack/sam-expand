import { test } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readFile, writeFile, unlink } from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

await test('nested', async (t) => {
  for (const { expected, argv } of [
    {
      expected: [
        'sam',
        ['build', '-t', path.join(__dirname, 'fixtures', 'nested.expanded.yml')]
      ],
      argv: [
        ...process.argv,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'nested.yml')
      ]
    },
    {
      expected: [
        'sam',
        ['validate', '-t', path.join(__dirname, 'fixtures', 'nested.yml')]
      ],
      argv: [
        ...process.argv,
        'validate',
        '-t',
        path.join(__dirname, 'fixtures/nested.yml')
      ]
    },
    {
      expected: [
        'sam',
        [
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'nested.yml'),
          '--lint'
        ]
      ],
      argv: [
        ...process.argv,
        'validate',
        '-t',
        path.join(__dirname, 'fixtures', 'nested.yml'),
        '--lint'
      ]
    }
  ]) {
    await t.test(
      `sam ${argv.slice(2).join(' ').replace(__dirname, '.')}`,
      async () => {
        let spawnArguments
        const expand = await esmock('../../src/expand.js', {
          'node:process': {
            argv
          },
          // eslint-disable-next-line @typescript-eslint/require-await
          async '../../src/spawn.js'(...arguments_) {
            spawnArguments = arguments_
          }
        })
        await expand()
        assert.deepEqual(spawnArguments, expected)
      }
    )
  }
})

await test('nested with not found location', async () => {
  const expand = await esmock('../../src/expand.js', {
    'node:process': {
      argv: [
        ...process.argv,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'nested-not-found.yml')
      ]
    }
  })
  await assert.rejects(expand(), {
    message: './does-not-exists.yml not found for Nested'
  })
})

await test('relative path with no dot', async () => {
  try {
    const template = await readFile(
      path.join(__dirname, 'fixtures', 'nested.yml'),
      'utf8'
    )
    await writeFile(
      path.join(__dirname, 'fixtures', 'nested-relative.yml'),
      template.replace('./valid-schema.yml', 'valid-schema.yml')
    )
    const expand = await esmock.p('../../src/expand.js', {
      async '../../src/spawn.js'() {},
      'node:process': {
        argv: [
          undefined,
          undefined,
          'build',
          '-t',
          path.join(__dirname, 'fixtures', 'nested-relative.yml')
        ]
      }
    })
    await assert.doesNotReject(expand())
  } finally {
    await unlink(path.join(__dirname, 'fixtures', 'nested-relative.yml'))
  }
})

await test('absolute path with no dot', async () => {
  try {
    const template = await readFile(
      path.join(__dirname, 'fixtures', 'nested.yml'),
      'utf8'
    )
    await writeFile(
      path.join(__dirname, 'fixtures', 'nested-absolute.yml'),
      template.replace(
        './valid-schema.yml',
        path.join(__dirname, 'fixtures', 'valid-schema.yml')
      )
    )
    const expand = await esmock.p('../../src/expand.js', {
      async '../../src/spawn.js'() {},
      'node:process': {
        argv: [
          undefined,
          undefined,
          'build',
          '-t',
          path.join(__dirname, 'fixtures', 'nested-absolute.yml')
        ]
      }
    })
    await assert.doesNotReject(expand())
  } finally {
    await unlink(path.join(__dirname, 'fixtures', 'nested-absolute.yml'))
  }
})
