import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('samconfig parsing', async (t) => {
  for (const config of ['toml', 'yaml', 'yml']) {
    await t.test(config, async (_t) => {
      /* c8 ignore start */
      const mockLifecycle = mock.fn()
      /* c8 ignore end */
      const expand = await esmock.p('../../src/expand.js', {
        [path.join(__dirname, 'fixtures', 'do-nothing-plugin.mjs')]: {
          async lifecycle(plugin) {
            return mockLifecycle(plugin)
          }
        },
        'node:process': {
          argv: [
            null,
            null,
            'build',
            '-t',
            path.join(__dirname, 'fixtures', 'config', config, 'template.yml')
          ]
        },
        async '../../src/spawn.js'() {}
      })
      await expand()
      assert.equal(
        mockLifecycle.mock.calls[0].arguments[0].config.default.build.parameters
          .parameter_overrides,
        `Name=${config}`
      )
      mock.restoreAll()
    })
    await t.test(`--config-file relative paths ${config}`, async (_t) => {
      for (const configPath of [
        `samconfig.${config}`,
        `./samconfig.${config}`
      ]) {
        /* c8 ignore start */
        const mockLifecycle = mock.fn()
        /* c8 ignore end */
        const expand = await esmock.p('../../src/expand.js', {
          [path.join(__dirname, 'fixtures', 'do-nothing-plugin.mjs')]: {
            async lifecycle(plugin) {
              return mockLifecycle(plugin)
            }
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
                'config',
                config,
                'template.yml'
              ),
              '--config-file',
              configPath
            ]
          },
          async '../../src/spawn.js'() {}
        })
        await expand()
        assert.equal(
          mockLifecycle.mock.calls[0].arguments[0].config.default.build
            .parameters.parameter_overrides,
          `Name=${config}`
        )
        mock.restoreAll()
      }
    })
    await t.test(`--config-file absolute path ${config}`, async (_t) => {
      /* c8 ignore start */
      const mockLifecycle = mock.fn()
      /* c8 ignore end */
      const expand = await esmock.p('../../src/expand.js', {
        [path.join(__dirname, 'fixtures', 'do-nothing-plugin.mjs')]: {
          async lifecycle(plugin) {
            return mockLifecycle(plugin)
          }
        },
        'node:process': {
          argv: [
            null,
            null,
            'build',
            '-t',
            path.join(__dirname, 'fixtures', 'config', config, 'template.yml'),
            '--config-file',
            path.join(
              __dirname,
              'fixtures',
              'config',
              config,
              `samconfig.${config}`
            )
          ]
        },
        async '../../src/spawn.js'() {}
      })
      await expand()
      assert.equal(
        mockLifecycle.mock.calls[0].arguments[0].config.default.build.parameters
          .parameter_overrides,
        `Name=${config}`
      )
      mock.restoreAll()
    })
  }
  await t.test('no config', async (_t) => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      [path.join(__dirname, 'fixtures', 'do-nothing-plugin.mjs')]: {
        async lifecycle(plugin) {
          return mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [
          null,
          null,
          'build',
          '-t',
          path.join(__dirname, 'fixtures', 'config', 'none', 'template.yml')
        ]
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls[0].arguments[0].config, null)
    mock.restoreAll()
  })
  await t.test(`--config-file unsupported`, async (_t) => {
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [
          null,
          null,
          'build',
          '-t',
          path.join(__dirname, 'fixtures', 'config', 'toml', 'template.yml'),
          '--config-file',
          path.join(__dirname, 'fixtures', 'config', 'toml', `samconfig.json`)
        ]
      },
      async '../../src/spawn.js'() {}
    })
    await assert.rejects(expand(), '--config-file unsupported')
  })
})
