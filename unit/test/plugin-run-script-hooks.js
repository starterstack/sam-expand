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
  await t.test(`validate: noop`, async () => {
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'script-hooks.yaml')
        ]
      },
      async '../../src/spawn.js'(...arguments_) {
        templatePath = arguments_[1][arguments_[1].indexOf('-t') + 1]
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

await test('run scripts hook plugin hooks', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks.yaml'),
    'utf8'
  )
  for (const command of ['build', 'package', 'deploy', 'delete']) {
    /* c8 ignore start */
    const writeMock = mock.fn()
    const spawnMock = mock.fn()
    /* c8 ignore end */
    await t.test(`${command}: hooks`, async () => {
      const expand = await esmock.p('../../src/expand.js', {
        'node:fs/promises': {
          // eslint-disable-next-line @typescript-eslint/require-await
          async writeFile(...arguments_) {
            writeMock(...arguments_)
          },
          // eslint-disable-next-line @typescript-eslint/require-await
          async unlink() {}
        },
        'node:process': {
          argv: [
            undefined,
            undefined,
            command,
            '-t',
            path.join(__dirname, 'fixtures', 'script-hooks.yaml')
          ]
        },
        // eslint-disable-next-line @typescript-eslint/require-await
        async '../../src/spawn.js'(...arguments_) {
          spawnMock(...arguments_)
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

await test('run scripts hook plugin noop', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks.yaml'),
    'utf8'
  )
  let template
  let templatePath
  /* c8 ignore next */
  const writeMock = mock.fn()
  await t.test(`validate: noop`, async () => {
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'script-hooks.yaml')
        ]
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'(...arguments_) {
        templatePath = arguments_[1][arguments_[1].indexOf('-t') + 1]
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

await test('run scripts hook plugin hooks with file resolver', async (t) => {
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
    await t.test(`${command}: hooks`, async () => {
      const expand = await esmock.p('../../src/expand.js', {
        'node:fs/promises': {
          // eslint-disable-next-line @typescript-eslint/require-await
          async writeFile(...arguments_) {
            writeMock(...arguments_)
          },
          // eslint-disable-next-line @typescript-eslint/require-await
          async unlink() {}
        },
        'node:process': {
          argv: [
            undefined,
            undefined,
            command,
            '-t',
            path.join(__dirname, 'fixtures', 'script-hooks-with-resolvers.yaml')
          ]
        },
        // eslint-disable-next-line @typescript-eslint/require-await
        async '../../src/spawn.js'(...arguments_) {
          spawnMock(...arguments_)
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

await test('run scripts hook plugin hooks with absolute file resolver', async () => {
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
        // eslint-disable-next-line @typescript-eslint/require-await
        async writeFile(...arguments_) {
          writeMock(...arguments_)
        },
        // eslint-disable-next-line @typescript-eslint/require-await
        async unlink() {}
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'build',
          '-t',
          path.join(
            __dirname,
            'fixtures',
            'script-hooks-with-absolute-file-resolver.yaml'
          )
        ]
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'(...arguments_) {
        spawnMock(...arguments_)
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

await test('run scripts hook plugin hooks with bad exports (file)', async () => {
  /* c8 ignore next */
  const writeMock = mock.fn()
  const expand = await esmock.p('../../src/expand.js', {
    'node:fs/promises': {
      // eslint-disable-next-line @typescript-eslint/require-await
      async writeFile(...arguments_) {
        writeMock(...arguments_)
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async unlink() {}
    },
    'node:process': {
      argv: [
        undefined,
        undefined,
        'build',
        '-t',
        path.join(
          __dirname,
          'fixtures',
          'script-hooks-with-resolvers-bad-file-exports.yaml'
        )
      ]
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async '../../src/spawn.js'() {}
  })
  await assert.rejects(expand(), {
    message: './script-hooks-file-resolver.mjs.missing is missing'
  })
})

await test('run scripts hook plugin noop', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks.yaml'),
    'utf8'
  )
  let template
  let templatePath
  /* c8 ignore next */
  const writeMock = mock.fn()
  await t.test(`validate: noop`, async () => {
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'script-hooks.yaml')
        ]
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'(...arguments_) {
        templatePath = arguments_[1][arguments_[1].indexOf('-t') + 1]
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
