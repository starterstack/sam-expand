import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readFile, writeFile, unlink } from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

await test('plugin path resolution', async (t) => {
  await t.test('INIT_CWD', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      [path.join(__dirname, 'fixtures', 'do-nothing-plugin.mjs')]: {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          return mockLifecycle(plugin)
        }
      },
      'node:process': {
        env: {
          get INIT_CWD() {
            return path.join(__dirname, 'fixtures')
          }
        },
        argv: [undefined, undefined, 'validate', '-t', './region.yml']
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.callCount(), 1)
    mock.restoreAll()
  })

  await t.test('cwd()', async () => {
    /* c8 ignore start */
    const mockLifecycle = mock.fn()
    /* c8 ignore end */
    const expand = await esmock.p('../../src/expand.js', {
      [path.join(__dirname, 'fixtures', 'do-nothing-plugin.mjs')]: {
        // eslint-disable-next-line @typescript-eslint/require-await
        async lifecycle(plugin) {
          return mockLifecycle(plugin)
        }
      },
      'node:process': {
        argv: [undefined, undefined, 'validate', '-t', './region.yml'],
        env: {},
        cwd() {
          return path.join(__dirname, 'fixtures')
        }
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(mockLifecycle.mock.callCount(), 1)
    mock.restoreAll()
  })
  await t.test('absolute path', async () => {
    try {
      const template = await readFile(
        path.join(__dirname, 'fixtures', 'relative-plugin.yml'),
        'utf8'
      )
      await writeFile(
        path.join(__dirname, 'fixtures', 'absolute-plugin.yml'),
        template.replace(
          'do-nothing-plugin.mjs',
          path.join(__dirname, 'fixtures', 'do-nothing-plugin.mjs')
        )
      )
      /* c8 ignore start */
      const mockLifecycle = mock.fn()
      /* c8 ignore end */
      const expand = await esmock.p('../../src/expand.js', {
        [path.join(__dirname, 'fixtures', 'do-nothing-plugin.mjs')]: {
          // eslint-disable-next-line @typescript-eslint/require-await
          async lifecycle(plugin) {
            return mockLifecycle(plugin)
          }
        },
        // eslint-disable-next-line @typescript-eslint/require-await
        async '../../src/spawn.js'() {},
        'node:process': {
          argv: [
            undefined,
            undefined,
            'validate',
            '-t',
            path.join(__dirname, 'fixtures', 'absolute-plugin.yml')
          ]
        }
      })
      await expand()
      assert.equal(mockLifecycle.mock.callCount(), 1)
      mock.restoreAll()
    } finally {
      await unlink(path.join(__dirname, 'fixtures', 'absolute-plugin.yml'))
    }
  })
})
