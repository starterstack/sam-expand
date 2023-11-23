import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseArgs } from 'node:util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('region resolution', async (t) => {
  await t.test('no region', async (_t) => {
    const mockLifecycle = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        async lifecycle(plugin) {
          return mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml')
        ],
        env: {
          get AWS_REGION() {}
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, undefined)
    mock.restoreAll()
  })

  await t.test('AWS_REGION us-east-1', async (_t) => {
    const mockLifecycle = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          null,
          null,
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
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'us-east-1')
  })

  await t.test('AWS_DEFAULT_REGION us-east-1 (no AWS_REGION)', async (_t) => {
    const mockLifecycle = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml')
        ],
        env: {
          get AWS_REGION() {},
          get AWS_DEFAULT_REGION() {
            return 'us-east-2'
          }
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'us-east-2')
  })

  await t.test(
    'AWS_DEFAULT_REGION eu-west-1 (AWS_REGION us-east-2)',
    async (_t) => {
      const mockLifecycle = mock.fn()
      const expand = await esmock.p('../../src/expand.js', {
        './fixtures/do-nothing-plugin.mjs': {
          async lifecycle(plugin) {
            mockLifecycle(plugin)
          }
        },
        'node:process': {
          argv: [
            null,
            null,
            'validate',
            '-t',
            path.join(__dirname, 'fixtures', 'region.yml')
          ],
          env: {
            get AWS_REGION() {
              return 'eu-west-1'
            },
            get AWS_DEFAULT_REGION() {
              return 'us-east-1'
            }
          }
        },
        async '../../src/spawn.js'() {}
      })
      await expand()
      assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'eu-west-1')
    }
  )

  await t.test('--region', async (_t) => {
    const mockLifecycle = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--region',
          'eu-north-1'
        ],
        env: {
          get AWS_REGION() {
            return 'us-east-1'
          },
          get AWS_DEFAULT_REGION() {
            return 'us-east-2'
          }
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'eu-north-1')
  })

  await t.test('command region override toml (default)', async (_t) => {
    const mockLifecycle = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-command-region.toml')
        ],
        env: {
          get AWS_REGION() {},
          get AWS_DEFAULT_REGION() {},
          /** @param {string} value */
          set AWS_REGION(value) {
            region = value
          }
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(
      mockLifecycle.mock.calls[0].arguments[0].region,
      'eu-central-1'
    )
  })

  await t.test('command region override toml (dev)', async (_t) => {
    const mockLifecycle = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-command-region.toml'),
          '--config-env',
          'dev'
        ],
        env: {
          get AWS_REGION() {},
          get AWS_DEFAULT_REGION() {},
          /** @param {string} value */
          set AWS_REGION(value) {
            region = value
          }
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'eu-west-1')
  })

  await t.test('global region override toml (default)', async (_t) => {
    const mockLifecycle = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-global-region.toml')
        ],
        env: {
          get AWS_REGION() {},
          get AWS_DEFAULT_REGION() {},
          /** @param {string} value */
          set AWS_REGION(value) {
            region = value
          }
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(
      mockLifecycle.mock.calls[0].arguments[0].region,
      'eu-central-1'
    )
  })

  await t.test('global region override toml (dev)', async (_t) => {
    const mockLifecycle = mock.fn()
    const expand = await esmock.p('../../src/expand.js', {
      './fixtures/do-nothing-plugin.mjs': {
        async lifecycle(plugin) {
          mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'samconfig-global-region.toml'),
          '--config-env',
          'dev'
        ],
        env: {
          get AWS_REGION() {},
          get AWS_DEFAULT_REGION() {},
          /** @param {string} value */
          set AWS_REGION(value) {
            region = value
          }
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].region, 'eu-west-1')
  })
})
