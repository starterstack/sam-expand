import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { readFile } from 'node:fs/promises'
import { yamlParse as parse } from 'yaml-cfn'

import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { lifecycle as overridesPlugin } from '../../src/plugins/parameter-overrides.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('parameter overrides plugin noop', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'parameters.yml'),
    'utf8'
  )
  for (const command of ['validate', 'package', 'delete']) {
    let template
    let templatePath
    /* c8 ignore start */
    const writeMock = mock.fn()
    /* c8 ignore end */
    await t.test(`${command}: noop`, async (_t) => {
      const expand = await esmock.p('../../src/expand.js', {
        'node:process': {
          argv: [
            null,
            null,
            command,
            '-t',
            path.join(__dirname, 'fixtures', 'parameters.yml')
          ]
        },
        async '../../src/spawn.js'(...args) {
          templatePath = args[1][args[1].indexOf('-t') + 1]
          template = await readFile(templatePath, 'utf8')
        }
      })
      await expand()
      assert.equal(writeMock.mock.callCount(), 0)
      assert.ok(!templatePath.includes('expanded'))
      assert.equal(templateContents, template)
      mock.restoreAll()
    })
  }
})

test('parameter overrides plugin resolve for deploy', async (_t) => {
  /* c8 ignore start */
  const spawnMock = mock.fn()
  /* c8 ignore end */
  const argv = [
    null,
    null,
    'deploy',
    '-t',
    path.join(__dirname, 'fixtures', 'parameters.yml')
  ]

  const expand = await esmock.p('../../src/expand.js', {
    'node:process': {
      argv
    },
    async '../../src/spawn.js'(...args) {
      spawnMock(...args)
    }
  })
  await expand()
  assert.equal(spawnMock.mock.callCount(), 1)
  assert.deepEqual(spawnMock.mock.calls[0].arguments, [
    'sam',
    [
      'deploy',
      '-t',
      path.join(__dirname, 'fixtures', 'parameters.yml'),
      '--parameter-overrides',
      "JSONNameWithDefault='someValue'",
      "JSONName='test'",
      "YAMLNameWithDefault='someValue'",
      "YAMLName='test'",
      "YMLNameWithDefault='someValue'",
      "YMLName='test'",
      "MJSNameWithDefault='someValue'",
      "MJSName='test'",
      "MJSASyncNoName='someValue'",
      "MJSASyncName='async name'"
    ]
  ])
  mock.restoreAll()
})

test('parameter overrides inline resolve for build', async (_t) => {
  /* c8 ignore start */
  const spawnMock = mock.fn()
  const writeMock = mock.fn()
  /* c8 ignore end */
  const argv = [
    null,
    null,
    'build',
    '-t',
    path.join(__dirname, 'fixtures', 'parameters-inline.yml')
  ]

  const expand = await esmock.p('../../src/expand.js', {
    'node:process': {
      argv
    },
    'node:fs/promises': {
      async writeFile(...args) {
        writeMock(...args)
      },
      async unlink() {}
    },
    async '../../src/spawn.js'(...args) {
      spawnMock(...args)
    }
  })
  await expand()
  assert.equal(spawnMock.mock.callCount(), 1)
  assert.deepEqual(spawnMock.mock.calls[0].arguments, [
    'sam',
    [
      'build',
      '--parameter-overrides',
      "Name3='value for name3'",
      "Name1='value for name1'",
      '-t',
      path.join(__dirname, 'fixtures', 'parameters-inline.expanded.yml')
    ]
  ])
  assert.equal(writeMock.mock.callCount(), 1)
  assert.equal(
    writeMock.mock.calls[0].arguments[1],
    `AWSTemplateFormatVersion: 2010-09-09
Transform:
  - AWS::Serverless-2016-10-31
Parameters:
  Name1:
    Type: String
  Name3:
    Type: String
Metadata:
  expand:
    plugins:
      - ../../../src/plugins/parameter-overrides.js
    config:
      parameterOverrides:
        - location: ./parameter-name.mjs
          overrides:
            - name: Name1
              exportName: name1
            - name: Name3
              exportName: name3
Resources:
  Thing:
    Type: Custom::Thingy
    Properties:
      ServiceToken: !Ref Name1
      Name: !Ref Name1
      Comment: !Ref Name3
      SubCommand: !Sub |-
        Some line with value for name 2
        multiline :)
      Nested:
        - A:
            - B:
                - C:
                    - D:
                        E: |-
                          value for name 2
                          multiline :)
Outputs:
  HelloWorldApi:
    Value: |-
      value for name 2
      multiline :)
Conditions:
  Name2: !Equals 
    - |-
      value for name 2
      multiline :)
    - value
`
  )
  mock.restoreAll()
})

test('parameter overrides plugin resolve for deploy (overrite existing parameter)', async (_t) => {
  /* c8 ignore start */
  const spawnMock = mock.fn()
  /* c8 ignore end */
  const argv = [
    null,
    null,
    'deploy',
    '-t',
    path.join(__dirname, 'fixtures', 'parameters.yml'),
    '--parameter-overrides',
    'MJSName=originalvalue'
  ]

  const expand = await esmock.p('../../src/expand.js', {
    'node:process': {
      argv
    },
    async '../../src/spawn.js'(...args) {
      spawnMock(...args)
    }
  })
  await expand()
  assert.equal(spawnMock.mock.callCount(), 1)
  assert.deepEqual(spawnMock.mock.calls[0].arguments, [
    'sam',
    [
      'deploy',
      '-t',
      path.join(__dirname, 'fixtures', 'parameters.yml'),
      '--parameter-overrides',
      "JSONNameWithDefault='someValue'",
      "JSONName='test'",
      "YAMLNameWithDefault='someValue'",
      "YAMLName='test'",
      "YMLNameWithDefault='someValue'",
      "YMLName='test'",
      "MJSNameWithDefault='someValue'",
      "MJSASyncNoName='someValue'",
      "MJSASyncName='async name'",
      "MJSName='test'"
    ]
  ])
  mock.restoreAll()
})

test('error handling', async (t) => {
  const baseTemplate = {
    AWSTemplateFormatVersion: '2010-09-09T00:00:00Z',
    Transform: ['AWS::Serverless-2016-10-31'],
    Metadata: {
      expand: {
        plugins: ['../../../src/plugins/parameter-overrides.js'],
        config: {
          parameterOverrides: []
        }
      }
    },
    Resources: {
      WaitConditionHandle: {
        Type: 'AWS::CloudFormation::WaitConditionHandle'
      },
      Parameters: {}
    }
  }

  await t.test('unsupported resolver', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Metadata.expand.config.parameterOverrides = [
      {
        location: './parameter-name.toml',
        overrides: [
          {
            name: 'Name',
            exportName: 'name'
          }
        ]
      }
    ]

    template.Parameters = {
      Name: {
        Type: 'String'
      }
    }

    const argv = []

    await assert.rejects(
      overridesPlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        command: 'deploy',
        lifecycle: 'pre:deploy',
        parse,
        argv,
        log() {}
      }),
      (err) => {
        assert.equal(
          err.message,
          'unsupported file ./parameter-name.toml must be .mjs, .json, .yaml, or .yml'
        )
        return true
      }
    )
  })

  await t.test('parameter not found', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Metadata.expand.config.parameterOverrides = [
      {
        location: './parameter-name.toml',
        overrides: [
          {
            name: 'Name',
            exportName: 'name'
          }
        ]
      }
    ]

    const argv = []

    await assert.rejects(
      overridesPlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        command: 'deploy',
        lifecycle: 'pre:deploy',
        parse,
        argv,
        log() {}
      }),
      (err) => {
        assert.equal(err.message, 'parameter Name not found in template')
        return true
      }
    )
  })

  for (const type of ['mjs', 'yaml', 'yml', 'json']) {
    await t.test(`matching value in ${type} file resolver`, async (_t) => {
      const template = structuredClone(baseTemplate)
      template.Metadata.expand.config.parameterOverrides = [
        {
          location: `./parameter-name.${type}`,
          overrides: [
            {
              name: 'Name',
              exportName: 'name'
            }
          ]
        }
      ]

      template.Parameters = {
        Name: {
          Type: 'String'
        }
      }

      const argv = []

      await overridesPlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        command: 'deploy',
        lifecycle: 'pre:deploy',
        parse,
        argv,
        log() {}
      })

      assert.deepEqual(argv, ['--parameter-overrides', "Name='test'"])
    })

    await t.test(`missing value in ${type} file resolver`, async (_t) => {
      const template = structuredClone(baseTemplate)
      template.Metadata.expand.config.parameterOverrides = [
        {
          location: `./parameter-name.${type}`,
          overrides: [
            {
              name: 'Name',
              exportName: 'missing'
            }
          ]
        }
      ]

      template.Parameters = {
        Name: {
          Type: 'String'
        }
      }

      const argv = []

      await assert.rejects(
        overridesPlugin({
          template,
          templateDirectory: path.join(__dirname, 'fixtures'),
          command: 'deploy',
          lifecycle: 'pre:deploy',
          parse,
          argv,
          log() {}
        }),
        (err) => {
          assert.equal(
            err.message,
            `parameter Name resolver ./parameter-name.${type} missing missing`
          )
          return true
        }
      )
    })

    await t.test(
      `missing value with default value in ${type} file resolver`,
      async (_t) => {
        const template = structuredClone(baseTemplate)
        template.Metadata.expand.config.parameterOverrides = [
          {
            location: `./parameter-name.${type}`,
            overrides: [
              {
                name: 'Name',
                exportName: 'missing',
                defaultValue: 'default'
              }
            ]
          }
        ]

        template.Parameters = {
          Name: {
            Type: 'String'
          }
        }

        const argv = []

        await overridesPlugin({
          template,
          templateDirectory: path.join(__dirname, 'fixtures'),
          command: 'deploy',
          lifecycle: 'pre:deploy',
          parse,
          argv,
          log() {}
        })

        assert.deepEqual(argv, ['--parameter-overrides', "Name='default'"])
      }
    )
  }
})
