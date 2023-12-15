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
    'utf-8'
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

test('run scripts hook plugin hooks with cloudformation resolver missing output', async (t) => {
  for (const missing of [
    undefined,
    null,
    {
      Stacks: [
        {
          Outputs: []
        }
      ]
    },
    { Stacks: [] },
    { Stacks: [{}] }
  ]) {
    cfMock.reset()
    cfMock.on(DescribeStacksCommand).resolves(missing)
    /* c8 ignore start */
    const writeMock = mock.fn()
    const spawnMock = mock.fn()
    /* c8 ignore end */
    await t.test('pre:build', async (_t) => {
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
              'script-hooks-with-resolvers-bad-cf-exports.yaml'
            )
          ]
        },
        async '../../src/spawn.js'(...args) {
          spawnMock(...args)
        }
      })
      await assert.rejects(expand(), {
        message: 'uncached.prebuild is missing'
      })
      mock.restoreAll()
    })
  }
})

test('run scripts hook plugin hooks with cloudformation resolver missing output (default)', async (t) => {
  for (const missing of [
    undefined,
    null,
    {
      Stacks: [
        {
          Outputs: []
        }
      ]
    },
    { Stacks: [] },
    { Stacks: [{}] }
  ]) {
    cfMock.reset()
    cfMock.on(DescribeStacksCommand).resolves(missing)
    /* c8 ignore start */
    const writeMock = mock.fn()
    const spawnMock = mock.fn()
    /* c8 ignore end */
    await t.test('pre:build', async (_t) => {
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
              'script-hooks-with-resolvers-bad-cf-exports-default.yaml'
            )
          ]
        },
        async '../../src/spawn.js'(...args) {
          spawnMock(...args)
        }
      })
      await assert.doesNotReject(expand())
      mock.restoreAll()
    })
  }
})

test('run scripts hook plugin hooks with cloudformation resolver (no region)', async (t) => {
  const templateContents = await readFile(
    path.join(
      __dirname,
      'fixtures',
      'script-hooks-with-resolvers-no-region.yaml'
    ),
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
            path.join(
              __dirname,
              'fixtures',
              'script-hooks-with-resolvers-no-region.yaml'
            ),
            '--region',
            'us-east-1'
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

test('run scripts hook plugin hooks with no region (file)', async (_t) => {
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
          'script-hooks-with-resolvers-no-region.yaml'
        ),
        '--config-file',
        path.join(__dirname, 'fixtures', 'samconfig-no-global-region.toml')
      ]
    },
    async '../../src/spawn.js'() {}
  })
  await assert.rejects(expand(), {
    message: "test.prebuild can't be resolved, missing region"
  })
})

test('run scripts hook plugin hooks with resolver that contains no stack name or self', async (_t) => {
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
          'script-hooks-with-resolvers-no-stack-name.yml'
        ),
        '--region',
        'us-east-1'
      ]
    },
    async '../../src/spawn.js'() {}
  })
  await assert.rejects(expand(), { message: 'prebuild is missing stackName' })
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

test('run scripts hook plugin hooks with self cloudformation resolver infer stackname from config global', async (t) => {
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
            '--region',
            'us-east-1',
            '-t',
            path.join(
              __dirname,
              'fixtures',
              'script-hooks-with-self-resolvers.yaml'
            ),
            '--config-file',
            './samconfig-global-test-stack-name.toml'
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

test('run scripts hook plugin hooks with self cloudformation resolver infer stackname from config command', async (t) => {
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
            '--region',
            'us-east-1',
            '-t',
            path.join(
              __dirname,
              'fixtures',
              'script-hooks-with-self-resolvers.yaml'
            ),
            '--config-file',
            './samconfig-command-test-stack-name.toml'
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
