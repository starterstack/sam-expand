import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { readFile } from 'node:fs/promises'

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { lifecycle as runScriptHooksPlugin } from '../../src/plugins/run-script-hooks.js'

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
      'node:fs/promises': {
        async writeFile(...args) {
          writeMock(...args)
        }
      },
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'script-hooks.yaml')
        ],
        env: {
          get INIT_CWD() {
            return __dirname
          }
        }
      },
      async '../../src/spawn.js'(...args) {
        templatePath = args[1][args[1].indexOf('-t') + 1]
        template = await readFile(templatePath, 'utf-8')
      }
    })
    await expand()
    assert.equal(writeMock.mock.calls.length, 0)
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
      assert.equal(spawnMock.mock.calls.length, 3)
      if (command === 'build') {
        assert.equal(writeMock.mock.calls.length, 1)
        assert.equal(writeMock.mock.calls[0].arguments[1], templateContents)
      } else {
        assert.equal(writeMock.mock.calls.length, 0)
      }
      assert.equal(spawnMock.mock.calls[1].arguments[0], 'sam')
      assert.equal(spawnMock.mock.calls[1].arguments[1][0], command)
      assert.deepEqual(spawnMock.mock.calls[0].arguments, [
        'echo',
        [{ value: `pre:${command}` }]
      ])
      assert.deepEqual(spawnMock.mock.calls[2].arguments, [
        'echo',
        [{ value: `post:${command}` }]
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
      'node:fs/promises': {
        async writeFile(...args) {
          writeMock(...args)
        }
      },
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'script-hooks.yaml')
        ],
        env: {
          get INIT_CWD() {
            return __dirname
          }
        }
      },
      async '../../src/spawn.js'(...args) {
        templatePath = args[1][args[1].indexOf('-t') + 1]
        template = await readFile(templatePath, 'utf-8')
      }
    })
    await expand()
    assert.equal(writeMock.mock.calls.length, 0)
    assert.ok(!templatePath.includes('expanded'))
    assert.equal(templateContents, template)
    mock.restoreAll()
  })
})
