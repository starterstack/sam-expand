import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { readFile } from 'node:fs/promises'

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { lifecycle as esbuildPlugin } from '../../src/plugins/esbuild-node.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('esbuild plugin noop', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'esbuild-single-lambda.yaml'),
    'utf-8'
  )
  for (const command of ['validate', 'package', 'deploy', 'delete']) {
    let template
    let templatePath
    const writeMock = mock.fn()
    await t.test(`${command}: noop`, async (_t) => {
      const expand = await esmock.p('../../src/expand.js', {
        'node:process': {
          argv: [
            null,
            null,
            command,
            '-t',
            path.join(__dirname, 'fixtures', 'esbuild-single-lambda.yaml')
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
  }
})

test('single lambda', async (_t) => {
  let templatePath
  const writeMock = mock.fn()
  const unlinkMock = mock.fn()
  const expand = await esmock.p('../../src/expand.js', {
    'node:fs/promises': {
      async writeFile(...args) {
        writeMock(...args)
      },
      async unlink(...args) {
        unlinkMock(...args)
      }
    },
    'node:process': {
      argv: [
        null,
        null,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'esbuild-single-lambda.yaml')
      ]
    },
    async '../../src/spawn.js'(...args) {
      templatePath = args[1][args[1].indexOf('-t') + 1]
    }
  })
  await expand()
  assert.equal(writeMock.mock.callCount(), 1)
  assert.equal(unlinkMock.mock.callCount(), 1)
  assert.ok(templatePath.includes('expanded'))
  assert.equal(
    writeMock.mock.calls[0].arguments[1],
    `AWSTemplateFormatVersion: 2010-09-09
Transform:
  - AWS::Serverless-2016-10-31
Metadata:
  expand:
    plugins:
      - ../../../src/plugins/esbuild-node.js
    config:
      esbuild:
        config: ./esbuild-config.yaml
Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs20.x
      CodeUri: hello-world/
      Handler: app.lambdaHandler
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello
            Method: get
    Metadata:
      BuildMethod: esbuild
      BuildProperties:
        Bundle: true
        Format: esm
        OutExtension:
          - .js=.mjs
        Sourcemap: true
        Target: node18
        External:
          - '@aws-sdk/*'
        Define:
          - require.resolve=undefined
        Banner:
          - |
            js=import { createRequire } from 'node:module'
            import { dirname } from 'node:path'
            import { fileURLToPath } from 'node:url'

            const require = createRequire(import.meta.url)
            const __filename = fileURLToPath(import.meta.url)
            const __dirname = dirname(__filename)
        Platform: node
        EntryPoints:
          - app.ts
`
  )
  mock.restoreAll()
})

test('lambda missing entry point', async (_t) => {
  const expand = await esmock.p('../../src/expand.js', {
    'node:process': {
      argv: [
        null,
        null,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'esbuild-no-entry-point.yaml')
      ]
    }
  })
  await assert.rejects(expand(), {
    message: 'no entry point found for missing.lambdaHandler'
  })
  mock.restoreAll()
})

test('two node lambda', async (_t) => {
  let templatePath
  const writeMock = mock.fn()
  const unlinkMock = mock.fn()
  const expand = await esmock.p('../../src/expand.js', {
    'node:fs/promises': {
      async writeFile(...args) {
        writeMock(...args)
      },
      async unlink(...args) {
        unlinkMock(...args)
      }
    },
    'node:process': {
      argv: [
        null,
        null,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'esbuild-two-lambdas.yaml')
      ]
    },
    async '../../src/spawn.js'(...args) {
      templatePath = args[1][args[1].indexOf('-t') + 1]
    }
  })
  await expand()
  assert.equal(writeMock.mock.callCount(), 1)
  assert.equal(unlinkMock.mock.callCount(), 1)
  assert.ok(templatePath.includes('expanded'))
  assert.equal(
    writeMock.mock.calls[0].arguments[1],
    `AWSTemplateFormatVersion: 2010-09-09
Transform:
  - AWS::Serverless-2016-10-31
Metadata:
  expand:
    plugins:
      - ../../../src/plugins/esbuild-node.js
    config:
      esbuild:
        config: ./esbuild-config.yaml
Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs20.x
      CodeUri: hello-world/
      Handler: app.lambdaHandler
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello
            Method: get
    Metadata:
      BuildMethod: esbuild
      BuildProperties:
        Bundle: true
        Format: esm
        OutExtension:
          - .js=.mjs
        Sourcemap: true
        Target: node18
        External:
          - '@aws-sdk/*'
        Define:
          - require.resolve=undefined
        Banner:
          - |
            js=import { createRequire } from 'node:module'
            import { dirname } from 'node:path'
            import { fileURLToPath } from 'node:url'

            const require = createRequire(import.meta.url)
            const __filename = fileURLToPath(import.meta.url)
            const __dirname = dirname(__filename)
        Platform: node
        EntryPoints:
          - app.ts
  HelloWorldFunction2:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs20.x
      CodeUri: hello-world/
      Handler: app.lambdaHandler
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello2
            Method: get
    Metadata:
      BuildMethod: esbuild
      BuildProperties:
        Bundle: true
        Format: esm
        OutExtension:
          - .js=.mjs
        Sourcemap: true
        Target: node18
        External:
          - '@aws-sdk/*'
        Define:
          - require.resolve=undefined
        Banner:
          - |
            js=import { createRequire } from 'node:module'
            import { dirname } from 'node:path'
            import { fileURLToPath } from 'node:url'

            const require = createRequire(import.meta.url)
            const __filename = fileURLToPath(import.meta.url)
            const __dirname = dirname(__filename)
        Platform: node
        EntryPoints:
          - app.ts
`
  )
  mock.restoreAll()
})

test('non node lambda', async (_t) => {
  let templatePath
  const writeMock = mock.fn()
  const unlinkMock = mock.fn()
  const expand = await esmock.p('../../src/expand.js', {
    'node:fs/promises': {
      async writeFile(...args) {
        writeMock(...args)
      },
      async unlink(...args) {
        unlinkMock(...args)
      }
    },
    'node:process': {
      argv: [
        null,
        null,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'esbuild-non-node-lambda.yaml'),
        '--debug'
      ]
    },
    async '../../src/spawn.js'(...args) {
      templatePath = args[1][args[1].indexOf('-t') + 1]
    }
  })
  await expand()
  assert.equal(writeMock.mock.callCount(), 1)
  assert.equal(unlinkMock.mock.callCount(), 1)
  assert.ok(templatePath.includes('expanded'))
  assert.equal(
    writeMock.mock.calls[0].arguments[1],
    `AWSTemplateFormatVersion: 2010-09-09
Transform:
  - AWS::Serverless-2016-10-31
Metadata:
  expand:
    plugins:
      - ../../../src/plugins/esbuild-node.js
    config:
      esbuild:
        config: ./esbuild-config.yaml
Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs20.x
      CodeUri: hello-world/
      Handler: app.lambdaHandler
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello
            Method: get
    Metadata:
      BuildMethod: esbuild
      BuildProperties:
        Bundle: true
        Format: esm
        OutExtension:
          - .js=.mjs
        Sourcemap: true
        Target: node18
        External:
          - '@aws-sdk/*'
        Define:
          - require.resolve=undefined
        Banner:
          - |
            js=import { createRequire } from 'node:module'
            import { dirname } from 'node:path'
            import { fileURLToPath } from 'node:url'

            const require = createRequire(import.meta.url)
            const __filename = fileURLToPath(import.meta.url)
            const __dirname = dirname(__filename)
        Platform: node
        EntryPoints:
          - app.ts
  HelloWorldFunction2:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: python3.11
      CodeUri: hello-world/
      Handler: app.lambdaHandler
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello2
            Method: get
`
  )
  mock.restoreAll()
})

test('ignore rules', async (t) => {
  const baseTemplate = {
    AWSTemplateFormatVersion: '2010-09-09T00:00:00Z',
    Transform: ['AWS::Serverless-2016-10-31'],
    Metadata: {
      expand: {
        plugins: ['../../../src/plugins/esbuild-node.js'],
        config: {
          esbuild: {
            config: './esbuild-config.yaml'
          }
        }
      }
    },
    Resources: {
      WaitConditionHandle: {
        Type: 'AWS::CloudFormation::WaitConditionHandle'
      },
      HelloWorldFunction: {
        Type: 'AWS::Serverless::Function',
        Properties: {
          CodeUri: 'hello-world/',
          Handler: 'app.lambdaHandler'
        }
      }
    }
  }

  await t.test('non node runtime', async (_t) => {
    const template = structuredClone(baseTemplate)
    const copy = structuredClone(template)

    await esbuildPlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      command: 'build',
      lifecycle: 'expand',
      parse() {},
      log() {}
    })

    assert.deepEqual(template, copy)
  })

  await t.test('non zip package type', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Resources.HelloWorldFunction.Properties.Runtime = 'nodejs20.x'
    template.Resources.HelloWorldFunction.Properties.PackageType = 'NonZip'
    const copy = structuredClone(template)

    await esbuildPlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      command: 'build',
      lifecycle: 'expand',
      parse() {},
      log() {}
    })

    assert.deepEqual(template, copy)
  })

  await t.test('inline code', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Resources.HelloWorldFunction.Properties.Runtime = 'nodejs20.x'
    template.Resources.HelloWorldFunction.Properties.InlineCode = 'x'
    const copy = structuredClone(template)

    await esbuildPlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      command: 'build',
      lifecycle: 'expand',
      parse() {},
      log() {}
    })

    assert.deepEqual(template, copy)
  })

  await t.test('code uri object', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Resources.HelloWorldFunction.Properties.Runtime = 'nodejs20.x'
    template.Resources.HelloWorldFunction.Properties.CodeUri = {}
    const copy = structuredClone(template)

    await esbuildPlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      command: 'build',
      lifecycle: 'expand',
      parse() {},
      log() {}
    })

    assert.deepEqual(template, copy)
  })

  await t.test('code uri s3 location', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Resources.HelloWorldFunction.Properties.Runtime = 'nodejs20.x'
    template.Resources.HelloWorldFunction.Properties.CodeUri = 's3:'
    const copy = structuredClone(template)

    await esbuildPlugin({
      template,
      templateDirectory: path.join(__dirname, 'fixtures'),
      command: 'build',
      lifecycle: 'expand',
      parse() {},
      log() {}
    })

    assert.deepEqual(template, copy)
  })

  await t.test('fail if build method already specified', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Resources.HelloWorldFunction.Properties.Runtime = 'nodejs20.x'
    template.Resources.HelloWorldFunction.Metadata = { BuildMethod: 'x' }
    const copy = structuredClone(template)

    await assert.rejects(
      esbuildPlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        command: 'build',
        lifecycle: 'expand',
        parse() {},
        log() {}
      }),
      (err) => {
        assert.equal(
          err.message,
          'lambda HelloWorldFunction already has Metadata.BuildMethod specified'
        )
        return true
      }
    )

    assert.deepEqual(template, copy)
  })

  await t.test('fail if build properties already specified', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Resources.HelloWorldFunction.Properties.Runtime = 'nodejs20.x'
    template.Resources.HelloWorldFunction.Metadata = { BuildProperties: 'x' }
    const copy = structuredClone(template)

    await assert.rejects(
      esbuildPlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        command: 'build',
        lifecycle: 'expand',
        parse() {},
        log() {}
      }),
      (err) => {
        assert.equal(
          err.message,
          'lambda HelloWorldFunction already has Metadata.BuildProperties specified'
        )
        return true
      }
    )

    assert.deepEqual(template, copy)
  })

  await t.test('fail if missing handler', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Resources.HelloWorldFunction.Properties.Runtime = 'nodejs20.x'
    template.Resources.HelloWorldFunction.Properties.Handler = null
    const copy = structuredClone(template)

    await assert.rejects(
      esbuildPlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        command: 'build',
        lifecycle: 'expand',
        parse() {},
        log() {}
      }),
      (err) => {
        assert.equal(err.message, 'lambda HelloWorldFunction missing handler')
        return true
      }
    )

    assert.deepEqual(template, copy)
  })

  await t.test('fail if missing code uri', async (_t) => {
    const template = structuredClone(baseTemplate)
    template.Resources.HelloWorldFunction.Properties.Runtime = 'nodejs20.x'
    template.Resources.HelloWorldFunction.Properties.CodeUri = ''
    const copy = structuredClone(template)

    await assert.rejects(
      esbuildPlugin({
        template,
        templateDirectory: path.join(__dirname, 'fixtures'),
        command: 'build',
        log() {},
        lifecycle: 'expand',
        parse() {},
        log() {}
      }),
      (err) => {
        assert.equal(err.message, 'lambda HelloWorldFunction missing codeUri')
        return true
      }
    )

    assert.deepEqual(template, copy)
  })
})
