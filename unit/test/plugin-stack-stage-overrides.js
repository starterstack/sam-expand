import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { readFile } from 'node:fs/promises'

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { lifecycle as stackStagePlugin } from '../../src/plugins/stack-stage-overrides.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('stack stage plugin noop', async (t) => {
  for (const command of ['validate', 'build']) {
    const spawnMock = mock.fn()
    await t.test(`${command}: noop`, async (_t) => {
      const expand = await esmock.p('../../src/expand.js', {
        'node:fs/promises': {
          async writeFile() {},
          async unlink() {}
        },
        'node:process': {
          argv: [
            null,
            null,
            command,
            '-t',
            path.join(__dirname, 'fixtures', 'stack-stage-overrides.yaml')
          ],
          env: {
            get INIT_CWD() {
              return __dirname
            }
          }
        },
        async '../../src/spawn.js'(...args) {
          spawnMock(...args)
        }
      })
      await expand()
      assert.equal(spawnMock.mock.calls.length, 1)

      for (const arg of spawnMock.mock.calls[0].arguments) {
        const missingArguments = [
          '--region',
          '--config-env',
          '--stack-name',
          '--tags'
        ]
        for (const missing of missingArguments) {
          assert.equal(arg.indexOf(missing), -1, missing)
        }
      }

      mock.restoreAll()
    })
  }
})

test('arguments', async (t) => {
  const baseTemplate = {
    AWSTemplateFormatVersion: '2010-09-09T00:00:00Z',
    Transform: ['AWS::Serverless-2016-10-31'],
    Metadata: {
      expand: {
        plugins: ['../../../src/plugins/stack-stage-overrides.js'],
        config: {
          'stack-stage-overrides': {}
        }
      }
    },
    Resources: {
      WaitConditionHandle: {
        Type: 'AWS::CloudFormation::WaitConditionHandle'
      }
    }
  }

  await t.test('non extra argv', async (_t) => {
    const template = structuredClone(baseTemplate)
    const argv = []

    await stackStagePlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      command: 'build',
      lifecycle: 'expand',
      argv,
      log() {}
    })

    assert.deepEqual(argv, [])
  })

  await t.test('ignore config', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Metadata.expand.config['stack-stage-overrides'] = {
      region: 'eu-north-1',
      'config-env': 'x',
      'suffix-stage': true,
      stage: 'global'
    }

    const argv = []

    await stackStagePlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      command: 'build',
      lifecycle: 'expand',
      argv,
      log() {}
    })

    assert.deepEqual(argv, [])
  })

  await t.test('--region', async (t) => {
    for (const lifecycle of ['pre:package', 'pre:deploy', 'pre:delete']) {
      await t.test(lifecycle, async () => {
        const template = structuredClone(baseTemplate)
        template.Metadata.expand.config['stack-stage-overrides'] = {
          region: 'eu-north-1'
        }
        const argv = []

        await stackStagePlugin({
          template,
          templateDirectory: path.join(__dirname, 'fixtures'),
          lifecycle,
          argv,
          log() {}
        })
        assert.deepEqual(argv, ['--region', 'eu-north-1'])
      })
    }
  })

  await t.test('--config-env', async (t) => {
    for (const lifecycle of ['pre:package', 'pre:deploy', 'pre:delete']) {
      await t.test(lifecycle, async () => {
        const template = structuredClone(baseTemplate)
        template.Metadata.expand.config['stack-stage-overrides'] = {
          'config-env': 'global'
        }
        const argv = []

        await stackStagePlugin({
          template,
          templateDirectory: path.join(__dirname, 'fixtures'),
          lifecycle,
          argv,
          log() {}
        })
        assert.deepEqual(argv, ['--config-env', 'global'])
      })
    }
  })

  await t.test('default stack name with new tags', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Metadata.expand.config['stack-stage-overrides'] = {}
    const argv = ['--parameter-overrides', 'Stack=mystack']

    await stackStagePlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      lifecycle: 'pre:deploy',
      argv,
      log() {}
    })
    assert.deepEqual(argv, [
      '--parameter-overrides',
      'Stack=mystack',
      '--stack-name',
      'mystack-fixtures',
      '--tags',
      'ManagedBy=mystack'
    ])
  })

  await t.test('default stack name with updated tags', async (t) => {
    for (const tag of ['ManagedBy=mystack', 'ManagedBy=mystack-x', undefined]) {
      await t.test(tag, async () => {
        const template = structuredClone(baseTemplate)
        template.Metadata.expand.config['stack-stage-overrides'] = {}
        const argv = [
          '--parameter-overrides',
          'Stack=mystack',
          '--tags',
          tag,
          'X=1'
        ].filter(Boolean)

        await stackStagePlugin({
          template,
          templateDirectory: path.join(__dirname, 'fixtures'),
          lifecycle: 'pre:deploy',
          argv,
          log() {}
        })
        assert.deepEqual(argv, [
          '--parameter-overrides',
          'Stack=mystack',
          '--tags',
          tag ?? 'ManagedBy=mystack',
          'X=1',
          '--stack-name',
          'mystack-fixtures'
        ])
      })
    }
  })

  await t.test('stack name with suffix', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Metadata.expand.config['stack-stage-overrides'] = {
      'suffix-stage': true
    }

    const argv = ['--parameter-overrides', 'Stack=mystack', 'Stage=feature']

    await stackStagePlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      lifecycle: 'pre:deploy',
      argv,
      log() {}
    })
    assert.deepEqual(argv, [
      '--parameter-overrides',
      'Stack=mystack',
      'Stage=feature',
      '--stack-name',
      'mystack-fixtures-feature',
      '--tags',
      'ManagedBy=mystack'
    ])
  })

  await t.test('delete stack name with suffix', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Metadata.expand.config['stack-stage-overrides'] = {
      'suffix-stage': true
    }

    const argv = ['--parameter-overrides', 'Stack=mystack', 'Stage=feature']

    await stackStagePlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      lifecycle: 'pre:delete',
      argv,
      log() {}
    })
    assert.deepEqual(argv, ['--stack-name', 'mystack-fixtures-feature'])
  })

  await t.test('stack name with suffix with missing stage', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Metadata.expand.config['stack-stage-overrides'] = {
      'suffix-stage': true
    }

    const argv = ['--parameter-overrides', 'Stack=mystack']

    await assert.rejects(
      stackStagePlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        lifecycle: 'pre:deploy',
        argv,
        log() {}
      }),
      (err) => {
        assert.equal(
          err.message,
          'suffix-stage only works with --parameter-overrides "Stage="'
        )
        return true
      }
    )
  })

  await t.test(
    'delete stack name with suffix with missing stage',
    async (_t) => {
      const template = structuredClone(baseTemplate)
      template.Metadata.expand.config['stack-stage-overrides'] = {
        'suffix-stage': true
      }

      const argv = ['--parameter-overrides', 'Stack=mystack']

      await assert.rejects(
        stackStagePlugin({
          template,
          templateDirectory: path.join(__dirname, 'fixtures'),
          lifecycle: 'pre:delete',
          argv,
          log() {}
        }),
        (err) => {
          assert.equal(
            err.message,
            'suffix-stage only works with --parameter-overrides "Stage="'
          )
          return true
        }
      )
    }
  )

  await t.test('stack name with suffix with missing stack', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Metadata.expand.config['stack-stage-overrides'] = {
      'suffix-stage': true
    }

    const argv = ['--parameter-overrides', 'Stage=dev']

    await assert.rejects(
      stackStagePlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        lifecycle: 'pre:deploy',
        argv,
        log() {}
      }),
      (err) => {
        assert.equal(
          err.message,
          'suffix-stage only works with both --parameter-overrides "Stage=" and (--stack-name or "Stack=")'
        )
        return true
      }
    )
  })

  await t.test(
    'delete stack name with suffix with missing stack',
    async (_t) => {
      const template = structuredClone(baseTemplate)
      template.Metadata.expand.config['stack-stage-overrides'] = {
        'suffix-stage': true
      }

      const argv = ['--parameter-overrides', 'Stage=dev']

      await assert.rejects(
        stackStagePlugin({
          template,
          templateDirectory: path.join(__dirname, 'fixtures'),
          lifecycle: 'pre:delete',
          argv,
          log() {}
        }),
        (err) => {
          assert.equal(
            err.message,
            'suffix-stage only works with both --parameter-overrides "Stage=" and (--stack-name or "Stack=")'
          )
          return true
        }
      )
    }
  )

  await t.test(
    'no default stack name with no suffix with missing stack',
    async (_t) => {
      const template = structuredClone(baseTemplate)
      template.Metadata.expand.config['stack-stage-overrides'] = {
        'suffix-stage': false
      }

      const argv = ['--parameter-overrides', 'Stage=dev']

      await stackStagePlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        lifecycle: 'pre:deploy',
        argv,
        log() {}
      })

      assert.deepEqual(argv, ['--parameter-overrides', 'Stage=dev'])
    }
  )

  await t.test(
    'delete: no default stack name with no suffix with missing stack',
    async (_t) => {
      const template = structuredClone(baseTemplate)
      template.Metadata.expand.config['stack-stage-overrides'] = {
        'suffix-stage': false
      }

      const argv = ['--parameter-overrides', 'Stage=dev']

      await stackStagePlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        lifecycle: 'pre:delete',
        argv,
        log() {}
      })

      assert.deepEqual(argv, [])
    }
  )

  await t.test('default stack name with no suffix', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Metadata.expand.config['stack-stage-overrides'] = {
      'suffix-stage': false
    }

    const argv = ['--parameter-overrides', 'Stage=dev', 'Stack=mystack']

    await stackStagePlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      lifecycle: 'pre:deploy',
      argv,
      log() {}
    })

    assert.deepEqual(argv, [
      '--parameter-overrides',
      'Stage=dev',
      'Stack=mystack',
      '--stack-name',
      'mystack-fixtures',
      '--tags',
      'ManagedBy=mystack'
    ])
  })

  await t.test('delete default stack name with no suffix', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Metadata.expand.config['stack-stage-overrides'] = {
      'suffix-stage': false
    }

    const argv = ['--parameter-overrides', 'Stage=dev', 'Stack=mystack']

    await stackStagePlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      lifecycle: 'pre:delete',
      argv,
      log() {}
    })

    assert.deepEqual(argv, ['--stack-name', 'mystack-fixtures'])
  })

  await t.test(
    'stack name with suffix with missing stack parameter and --stack-name',
    async (_t) => {
      const template = structuredClone(baseTemplate)
      template.Metadata.expand.config['stack-stage-overrides'] = {
        'suffix-stage': true
      }

      const argv = [
        '--parameter-overrides',
        'Stage=dev',
        '--stack-name',
        'mystack-fixtures'
      ]

      await stackStagePlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        lifecycle: 'pre:deploy',
        argv,
        log() {}
      })

      assert.deepEqual(argv, [
        '--parameter-overrides',
        'Stage=dev',
        '--stack-name',
        'mystack-fixtures-dev'
      ])
    }
  )

  await t.test(
    'delete stack name with suffix with missing stack parameter and --stack-name',
    async (_t) => {
      const template = structuredClone(baseTemplate)
      template.Metadata.expand.config['stack-stage-overrides'] = {
        'suffix-stage': true
      }

      const argv = [
        '--parameter-overrides',
        'Stage=dev',
        '--stack-name',
        'mystack-fixtures'
      ]

      await stackStagePlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        lifecycle: 'pre:delete',
        argv,
        log() {}
      })

      assert.deepEqual(argv, ['--stack-name', 'mystack-fixtures-dev'])
    }
  )

  await t.test(
    'default stack name with no suffix with missing stack parameter and --stack-name',
    async (_t) => {
      const template = structuredClone(baseTemplate)
      template.Metadata.expand.config['stack-stage-overrides'] = {
        'suffix-stage': false
      }

      const argv = [
        '--parameter-overrides',
        'Stage=dev',
        '--stack-name',
        'mystack-fixtures'
      ]

      await stackStagePlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        lifecycle: 'pre:deploy',
        argv,
        log() {}
      })

      assert.deepEqual(argv, [
        '--parameter-overrides',
        'Stage=dev',
        '--stack-name',
        'mystack-fixtures'
      ])
    }
  )

  await t.test(
    'delete default stack name with no suffix with missing stack parameter and --stack-name',
    async (_t) => {
      const template = structuredClone(baseTemplate)
      template.Metadata.expand.config['stack-stage-overrides'] = {
        'suffix-stage': false
      }

      const argv = [
        '--parameter-overrides',
        'Stage=dev',
        '--stack-name',
        'mystack-fixtures'
      ]

      await stackStagePlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        lifecycle: 'pre:delete',
        argv,
        log() {}
      })

      assert.deepEqual(argv, ['--stack-name', 'mystack-fixtures'])
    }
  )
})
