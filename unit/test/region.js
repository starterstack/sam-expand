import { test } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseArgs } from 'node:util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('empty template with no metadata', async (t) => {
  /*
  const region =
    values.region ??
    config?.[configEnv ?? 'default']?.command?.parameters?.region ??
    config?.[configEnv ?? 'default']?.global?.parameters?.region ??
    process.env.AWS_REGION ??
    process.env.AWS_DEFAULT_REGION

  */

  await t.test('no region', async (_t) => {
    let region
    const expand = await esmock('../../src/expand.js', {
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'empty.yml')
        ],
        env: {
          get AWS_REGION() {},
          /** @param {string} value */
          set AWS_REGION(value) {
            region = value
          }
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(region, undefined)
  })

  await t.test('AWS_REGION us-east-1', async (_t) => {
    let region
    const expand = await esmock('../../src/expand.js', {
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'empty.yml')
        ],
        env: {
          get AWS_REGION() {
            return 'us-east-1'
          },
          /** @param {string} value */
          set AWS_REGION(value) {
            region = value
          }
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(region, 'us-east-1')
  })

  await t.test('AWS_DEFAULT_REGION us-east-1 (no AWS_REGION)', async (_t) => {
    let region
    const expand = await esmock('../../src/expand.js', {
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'empty.yml')
        ],
        env: {
          get AWS_REGION() {},
          get AWS_DEFAULT_REGION() {
            return 'us-east-2'
          },

          /** @param {string} value */
          set AWS_REGION(value) {
            region = value
          }
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(region, 'us-east-2')
  })

  await t.test(
    'AWS_DEFAULT_REGION eu-west-1 (AWS_REGION us-east-2)',
    async (_t) => {
      let region
      const expand = await esmock('../../src/expand.js', {
        'node:process': {
          argv: [
            null,
            null,
            'validate',
            '-t',
            path.join(__dirname, 'fixtures', 'empty.yml')
          ],
          env: {
            get AWS_REGION() {
              return 'eu-west-1'
            },
            get AWS_DEFAULT_REGION() {
              return 'us-east-1'
            },

            /** @param {string} value */
            set AWS_REGION(value) {
              region = value
            }
          }
        },
        async '../../src/spawn.js'() {}
      })
      await expand()
      assert.equal(region, 'eu-west-1')
    }
  )

  await t.test('--region', async (_t) => {
    let region
    const expand = await esmock('../../src/expand.js', {
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'empty.yml'),
          '--region',
          'eu-north-1'
        ],
        env: {
          get AWS_REGION() {
            return 'us-east-1'
          },
          get AWS_DEFAULT_REGION() {
            return 'us-east-2'
          },
          /** @param {string} value */
          set AWS_REGION(value) {
            region = value
          }
        }
      },
      async '../../src/spawn.js'() {}
    })
    await expand()
    assert.equal(region, 'eu-north-1')
  })

  await t.test('command region override toml (default)', async (_t) => {
    let region
    const expand = await esmock('../../src/expand.js', {
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'empty.yml'),
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
    assert.equal(region, 'eu-central-1')
  })

  await t.test('command region override toml (dev)', async (_t) => {
    let region
    const expand = await esmock('../../src/expand.js', {
      'node:process': {
        argv: [
          null,
          null,
          'validate',
          '-t',
          path.join(__dirname, 'fixtures', 'empty.yml'),
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
    assert.equal(region, 'eu-west-1')
  })
})
