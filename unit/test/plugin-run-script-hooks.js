import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { readFile } from 'node:fs/promises'

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mockClient } from 'aws-sdk-client-mock'

import {
  CloudFormationClient,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation'

const cfMock = mockClient(CloudFormationClient)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('run scripts hook plugin noop', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks.yaml'),
    'utf-8'
  )
  let template
  let templatePath
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
        template = await readFile(templatePath, 'utf-8')
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
    'utf-8'
  )
  for (const command of ['build', 'package', 'deploy', 'delete']) {
    const writeMock = mock.fn()
    const spawnMock = mock.fn()
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
    'utf-8'
  )
  let template
  let templatePath
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
        template = await readFile(templatePath, 'utf-8')
      }
    })
    await expand()
    assert.equal(writeMock.mock.callCount(), 0)
    assert.ok(!templatePath.includes('expanded'))
    assert.equal(templateContents, template)
    mock.restoreAll()
  })
})

test('run scripts hook plugin hooks with cloudformation resolver', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks-with-resolvers.yaml'),
    'utf-8'
  )
  const commands = ['build', 'package', 'deploy', 'delete']
  cfMock.reset()
  cfMock.on(DescribeStacksCommand).resolves({
    Stacks: [
      {
        Outputs: commands.flatMap((command) => [
          {
            OutputKey: `pre${command}`,
            OutputValue: `cf.pre:${command}`
          },
          {
            OutputKey: `post${command}`,
            OutputValue: `cf.post:${command}`
          }
        ])
      }
    ]
  })
  for (const command of commands) {
    const writeMock = mock.fn()
    const spawnMock = mock.fn()
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
        [`pre:${command}cf.pre:${command}file.pre:${command}`]
      ])
      assert.deepEqual(spawnMock.mock.calls[2].arguments, [
        'echo',
        [`post:${command}cf.post:${command}file.post:${command}`]
      ])
      mock.restoreAll()
    })
  }
})

test('run scripts hook plugin hooks with self cloudformation resolver', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks-with-self-resolvers.yaml'),
    'utf-8'
  )
  const commands = ['build', 'package', 'deploy', 'delete']
  cfMock.reset()
  cfMock.on(DescribeStacksCommand).resolves({
    Stacks: [
      {
        Outputs: commands.flatMap((command) => [
          {
            OutputKey: `pre${command}`,
            OutputValue: `cf.pre:${command}`
          },
          {
            OutputKey: `post${command}`,
            OutputValue: `cf.post:${command}`
          }
        ])
      }
    ]
  })
  for (const command of commands) {
    const writeMock = mock.fn()
    const spawnMock = mock.fn()
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
            '--region',
            'us-east-1',
            '--stack-name',
            'test',
            '-t',
            path.join(
              __dirname,
              'fixtures',
              'script-hooks-with-self-resolvers.yaml'
            )
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
        [`pre:${command}cf.pre:${command}file.pre:${command}`]
      ])
      assert.deepEqual(spawnMock.mock.calls[2].arguments, [
        'echo',
        [`post:${command}cf.post:${command}file.post:${command}`]
      ])
      mock.restoreAll()
    })
  }
})

test('run scripts hook plugin noop', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'script-hooks.yaml'),
    'utf-8'
  )
  let template
  let templatePath
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
        template = await readFile(templatePath, 'utf-8')
      }
    })
    await expand()
    assert.equal(writeMock.mock.callCount(), 0)
    assert.ok(!templatePath.includes('expanded'))
    assert.equal(templateContents, template)
    mock.restoreAll()
  })
})
