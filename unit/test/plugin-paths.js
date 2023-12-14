import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('plugin path resolution', async (t) => {
  await t.test('INIT_CWD', async (_t) => {
    const mockLifecycle = mock.fn()
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
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml')
        ]
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls.length, 1)
    mock.restoreAll()
  })

  await t.test('cwd()', async (_t) => {
    const mockLifecycle = mock.fn()
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
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'region.yml')
        ],
        env: {
          get INIT_CWD() {}
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.calls.length, 1)
    mock.restoreAll()
  })
})
