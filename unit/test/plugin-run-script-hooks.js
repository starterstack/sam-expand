import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

await test('run scripts hook plugin noop', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks.yaml'),
    'utf8'
  )
  let template
  let templatePath
  /* c8 ignore next */
  const writeMock = mock.fn()
  await t.test(`validate: noop`, async (_t) => {
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'script-hooks.yaml')
        ]
      },
      async '../../src/spawn.js'(...args) {
        templatePath = args[1][args[1].indexOf('-t') + 1]
        template = await readFile(templatePath, 'utf8')
      }
    })
    await expand()
    assert.equal(writeMock.mock.callCount(), 0)
    assert.ok(!templatePath.includes('expanded'))
    assert.equal(templateContents, template)
    mock.restoreAll()
  })
})

test('run scripts hook plugin hooks', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks.yaml'),
    'utf8'
  )
  for (const command of ['build', 'package', 'deploy', 'delete']) {
    /* c8 ignore start */
    const writeMock = mock.fn()
    const spawnMock = mock.fn()
    /* c8 ignore end */
    await t.test(`${command}: hooks`, async (_t) => {
      const expand = await esmock.p('../../src/expand.js', {
        'node:fs/promises': {
          async writeFile(...args) {
            writeMock(...args)
          },
          async unlink() {}
        },
        'node:process': {
          argv: [
            null,
            null,
            command,
            '-t',
            path.join(__dirname, 'fixtures', 'script-hooks.yaml')
          ]
        },
        async '../../src/spawn.js'(...args) {
          spawnMock(...args)
        }
      })
      await expand()
      assert.equal(spawnMock.mock.callCount(), 3)
      if (command === 'build') {
        assert.equal(writeMock.mock.callCount(), 1)
        assert.equal(writeMock.mock.calls[0].arguments[1], templateContents)
      } else {
        assert.equal(writeMock.mock.callCount(), 0)
      }
      assert.equal(spawnMock.mock.calls[1].arguments[0], 'sam')
      assert.equal(spawnMock.mock.calls[1].arguments[1][0], command)
      assert.deepEqual(spawnMock.mock.calls[0].arguments, [
        'echo',
        [`pre:${command}`]
      ])
      assert.deepEqual(spawnMock.mock.calls[2].arguments, [
        'echo',
        [`post:${command}`]
      ])
      mock.restoreAll()
    })
  }
})

test('run scripts hook plugin noop', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks.yaml'),
    'utf8'
  )
  let template
  let templatePath
  /* c8 ignore next */
  const writeMock = mock.fn()
  await t.test(`validate: noop`, async (_t) => {
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'script-hooks.yaml')
        ]
      },
      async '../../src/spawn.js'(...args) {
        templatePath = args[1][args[1].indexOf('-t') + 1]
        template = await readFile(templatePath, 'utf8')
      }
    })
    await expand()
    assert.equal(writeMock.mock.callCount(), 0)
    assert.ok(!templatePath.includes('expanded'))
    assert.equal(templateContents, template)
    mock.restoreAll()
  })
})

test('run scripts hook plugin hooks with file resolver', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks-with-resolvers.yaml'),
    'utf8'
  )
  const commands = ['build', 'package', 'deploy', 'delete']
  for (const command of commands) {
    /* c8 ignore start */
    const writeMock = mock.fn()
    const spawnMock = mock.fn()
    /* c8 ignore end */
    await t.test(`${command}: hooks`, async (_t) => {
      const expand = await esmock.p('../../src/expand.js', {
        'node:fs/promises': {
          async writeFile(...args) {
            writeMock(...args)
          },
          async unlink() {}
        },
        'node:process': {
          argv: [
            null,
            null,
            command,
            '-t',
            path.join(__dirname, 'fixtures', 'script-hooks-with-resolvers.yaml')
          ]
        },
        async '../../src/spawn.js'(...args) {
          spawnMock(...args)
        }
      })
      await expand()
      assert.equal(spawnMock.mock.callCount(), 3)
      if (command === 'build') {
        assert.equal(writeMock.mock.callCount(), 1)
        assert.equal(writeMock.mock.calls[0].arguments[1], templateContents)
      } else {
        assert.equal(writeMock.mock.callCount(), 0)
      }
      assert.equal(spawnMock.mock.calls[1].arguments[0], 'sam')
      assert.equal(spawnMock.mock.calls[1].arguments[1][0], command)
      assert.deepEqual(spawnMock.mock.calls[0].arguments, [
        'echo',
        [`pre:${command}file.pre:${command}`]
      ])
      assert.deepEqual(spawnMock.mock.calls[2].arguments, [
        'echo',
        [`post:${command}file.post:${command}`]
      ])
      mock.restoreAll()
    })
  }
})

test('run scripts hook plugin hooks with absolute file resolver', async (_t) => {
  /* c8 ignore start */
  const writeMock = mock.fn()
  const spawnMock = mock.fn()
  /* c8 ignore end */
  try {
    await writeFile(
      path.join(
        __dirname,
        'fixtures',
        'script-hooks-with-absolute-file-resolver.yaml'
      ),
      `
AWSTemplateFormatVersion: 2010-09-09
Transform:
  - AWS::Serverless-2016-10-31
Metadata:
  expand:
    plugins:
      - ../../../src/plugins/run-script-hooks.js
    config:
      script:
        hooks:
          pre:build:
            - command: echo
              args:
                - file:
                    location: ${path.join(
                      __dirname,
                      'fixtures',
                      'script-hooks-file-resolver.mjs'
                    )}
                    exportName: test
Resources:
  WaitConditionHandle:
    Type: AWS::CloudFormation::WaitConditionHandle
`
    )
    const expand = await esmock.p('../../src/expand.js', {
      'node:fs/promises': {
        async writeFile(...args) {
          writeMock(...args)
        },
        async unlink() {}
      },
      'node:process': {
        argv: [
          null,
          null,
          'build',
          '-t',
          path.join(
            __dirname,
            'fixtures',
            'script-hooks-with-absolute-file-resolver.yaml'
          )
        ]
      },
      async '../../src/spawn.js'(...args) {
        spawnMock(...args)
      }
    })
    await assert.doesNotReject(expand())
  } finally {
    await unlink(
      path.join(
        __dirname,
        'fixtures',
        'script-hooks-with-absolute-file-resolver.yaml'
      )
    )
  }
})

test('run scripts hook plugin hooks with bad exports (file)', async (_t) => {
  /* c8 ignore next */
  const writeMock = mock.fn()
  const expand = await esmock.p('../../src/expand.js', {
    'node:fs/promises': {
      async writeFile(...args) {
        writeMock(...args)
      },
      async unlink() {}
    },
    'node:process': {
      argv: [
        null,
        null,
        'build',
        '-t',
        path.join(
          __dirname,
          'fixtures',
          'script-hooks-with-resolvers-bad-file-exports.yaml'
        )
      ]
    },
    async '../../src/spawn.js'() {}
  })
  await assert.rejects(expand(), {
    message: './script-hooks-file-resolver.mjs.missing is missing'
  })
})

test('run scripts hook plugin noop', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks.yaml'),
    'utf8'
  )
  let template
  let templatePath
  /* c8 ignore next */
  const writeMock = mock.fn()
  await t.test(`validate: noop`, async (_t) => {
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'script-hooks.yaml')
        ]
      },
      async '../../src/spawn.js'(...args) {
        templatePath = args[1][args[1].indexOf('-t') + 1]
        template = await readFile(templatePath, 'utf8')
      }
    })
    await expand()
    assert.equal(writeMock.mock.callCount(), 0)
    assert.ok(!templatePath.includes('expanded'))
    assert.equal(templateContents, template)
    mock.restoreAll()
  })
})
