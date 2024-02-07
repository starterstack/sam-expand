import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

await test('region resolution', async (t) => {
  await t.test('no region', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          return mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml')
        ],
        env: {}
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, undefined)
    mock.restoreAll()
  })

  await t.test('AWS_REGION us-east-1', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml')
        ],
        env: {
          get AWS_REGION() {
            return 'us-east-1'
          }
        }
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'us-east-1')
  })

  await t.test('AWS_DEFAULT_REGION us-east-1 (no AWS_REGION)', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-env',
          'qa'
        ],
        env: {
          get AWS_DEFAULT_REGION() {
            return 'us-east-2'
          }
        }
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'us-east-2')
  })

  await t.test(
    'AWS_DEFAULT_REGION eu-west-1 (AWS_REGION us-east-2)',
    async () => {
      /* c8 ignore start */
      const mockLifecycle = mock.fn()
      /* c8 ignore end */
      const expand = await esmock.p('../../src/expand.js', {
        './fixtures/do-nothing-plugin.mjs': {
          // eslint-disable-next-line @typescript-eslint/require-await
          async lifecycle(plugin) {
            mockLifecycle(plugin)
          }
        },
        'node:process': {
          argv: [
            undefined,
            undefined,
            'validate',
            '-t',
            path.join(__dirname, 'fixtures', 'region.yml')
          ],
          env: {
            get AWS_REGION() {
              return 'eu-west-1'
            }
          }
        },
        // eslint-disable-next-line @typescript-eslint/require-await
        async '../../src/spawn.js'() {}
      })
      await expand()
      assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'eu-west-1')
    }
  )

  await t.test('--region', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-no-global-region.toml'),
          '--region',
          'eu-north-1'
        ]
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.callCount(), 1)
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'eu-north-1')
  })

  await t.test('command region override toml (default)', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-command-region.toml')
        ],
        env: {}
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(
      mockLifecycle.mock.calls[0].arguments[0].region,
      'eu-central-1'
    )
  })

  await t.test('command region override toml (dev)', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-command-region.toml'),
          '--config-env',
          'dev'
        ],
        env: {}
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'eu-west-1')
  })

  await t.test('global region override toml (default)', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-global-region.toml')
        ],
        env: {}
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(
      mockLifecycle.mock.calls[0].arguments[0].region,
      'eu-central-1'
    )
  })

  await t.test('no default region', async () => {
    for (const configEnvironment of [
      'global',
      'default',
      'dev',
      'qa',
      'prod'
    ]) {
      for (const config of [
        'samconfig-no-global-region.toml',
        'samconfig-no-command-region.toml'
      ]) {
        /* c8 ignore start */
        const mockLifecycle = mock.fn()
        /* c8 ignore end */
        const expand = await esmock.p('../../src/expand.js', {
          './fixtures/do-nothing-plugin.mjs': {
            // eslint-disable-next-line @typescript-eslint/require-await
            async lifecycle(plugin) {
              mockLifecycle(plugin)
            }
          },
          'node:process': {
            argv: [
              undefined,
              undefined,
              'validate',
              '-t',
              path.join(__dirname, 'fixtures', 'region.yml'),
              '--config-env',
              configEnvironment,
              '--config-file',
              path.join(__dirname, 'fixtures', config)
            ],
            env: {}
          },
          // eslint-disable-next-line @typescript-eslint/require-await
          async '../../src/spawn.js'() {}
        })
        await expand()
        assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, undefined)
      }
    }
  })

  await t.test('global region override toml (dev)', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-global-region.toml'),
          '--config-env',
          'dev'
        ],
        env: {}
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'eu-west-1')
  })

  await t.test('command region override yaml (default)', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-command-region.yaml')
        ],
        env: {}
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(
      mockLifecycle.mock.calls[0].arguments[0].region,
      'eu-central-1'
    )
  })

  await t.test('command region override yaml (dev)', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-command-region.yaml'),
          '--config-env',
          'dev'
        ],
        env: {}
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'eu-west-1')
  })

  await t.test('global region override yaml (default)', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-global-region.yaml')
        ],
        env: {}
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(
      mockLifecycle.mock.calls[0].arguments[0].region,
      'eu-central-1'
    )
  })

  await t.test('global region override yaml (dev)', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          undefined,
          undefined,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-global-region.yaml'),
          '--config-env',
          'dev'
        ],
        env: {}
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'eu-west-1')
  })
})
