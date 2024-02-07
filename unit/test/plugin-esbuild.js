import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { readFile, writeFile, unlink } from 'node:fs/promises'

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { lifecycle as esbuildPlugin } from '../../src/plugins/esbuild-node.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

await test('esbuild plugin noop', async (t) => {
  const templateContents = await readFile(
    path.join(__dirname, 'fixtures', 'esbuild-single-lambda.yaml'),
    'utf8'
  )
  for (const command of ['validate', 'package', 'deploy', 'delete']) {
    let template
    let templatePath
    /* c8 ignore next */
    const writeMock = mock.fn()
    await t.test(`${command}: noop`, async () => {
      const expand = await esmock.p('../../src/expand.js', {
        'node:process': {
          argv: [
            undefined,
            undefined,
            command,
            '-t',
            path.join(__dirname, 'fixtures', 'esbuild-single-lambda.yaml')
          ]
        },
        // eslint-disable-next-line @typescript-eslint/require-await
        async '../../src/spawn.js'(...arguments_) {
          templatePath = arguments_[1][arguments_[1].indexOf('-t') + 1]
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

await test("esbuild doesn't crash when template has no resources", async () => {
  /* c8 ignore next */
  const expand = await esmock.p('../../src/expand.js', {
    'node:process': {
      argv: [
        undefined,
        undefined,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'esbuild-no-resources.yaml')
      ]
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async '../../src/spawn.js'() {}
  })
  await expand()
})

await test('single lambda', async () => {
  let templatePath
  /* c8 ignore start */
  const writeMock = mock.fn()
  const unlinkMock = mock.fn()
  /* c8 ignore end */
  const expand = await esmock.p('../../src/expand.js', {
    'node:fs/promises': {
      // eslint-disable-next-line @typescript-eslint/require-await
      async writeFile(...arguments_) {
        writeMock(...arguments_)
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async unlink(...arguments_) {
        unlinkMock(...arguments_)
      }
    },
    'node:process': {
      argv: [
        undefined,
        undefined,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'esbuild-single-lambda.yaml')
      ]
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async '../../src/spawn.js'(...arguments_) {
      templatePath = arguments_[1][arguments_[1].indexOf('-t') + 1]
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

await test('single lambda (global runtime)', async () => {
  let templatePath
  /* c8 ignore start */
  const writeMock = mock.fn()
  const unlinkMock = mock.fn()
  /* c8 ignore end */
  const expand = await esmock.p('../../src/expand.js', {
    'node:fs/promises': {
      // eslint-disable-next-line @typescript-eslint/require-await
      async writeFile(...arguments_) {
        writeMock(...arguments_)
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async unlink(...arguments_) {
        unlinkMock(...arguments_)
      }
    },
    'node:process': {
      argv: [
        undefined,
        undefined,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'esbuild-single-lambda-global.yaml')
      ]
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async '../../src/spawn.js'(...arguments_) {
      templatePath = arguments_[1][arguments_[1].indexOf('-t') + 1]
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
Globals:
  Function:
    Runtime: nodejs20.x
Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function
    Properties:
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

await test('single lambda with base directory', async () => {
  let templatePath
  /* c8 ignore start */
  const writeMock = mock.fn()
  const unlinkMock = mock.fn()
  /* c8 ignore end */
  const expand = await esmock.p('../../src/expand.js', {
    'node:fs/promises': {
      // eslint-disable-next-line @typescript-eslint/require-await
      async writeFile(...arguments_) {
        writeMock(...arguments_)
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async unlink(...arguments_) {
        unlinkMock(...arguments_)
      }
    },
    'node:process': {
      argv: [
        undefined,
        undefined,
        'build',
        '--base-dir',
        './hello-world',
        '-t',
        path.join(__dirname, 'fixtures', 'esbuild-single-lambda-base-dir.yaml')
      ]
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async '../../src/spawn.js'(...arguments_) {
      templatePath = arguments_[1][arguments_[1].indexOf('-t') + 1]
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
      CodeUri: /
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

await test('lambda missing entry point', async () => {
  const expand = await esmock.p('../../src/expand.js', {
    'node:process': {
      argv: [
        undefined,
        undefined,
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

await test('absolute config path', async () => {
  try {
    const template = await readFile(
      path.join(__dirname, 'fixtures', 'esbuild-no-entry-point.yaml'),
      'utf8'
    )
    await writeFile(
      path.join(__dirname, 'fixtures', 'esbuild-no-entry-point-absolute.yaml'),
      template.replace(
        './esbuild-config.yaml',
        path.join(__dirname, 'fixtures', 'esbuild-config.yaml')
      )
    )
    const expand = await esmock.p('../../src/expand.js', {
      'node:process': {
        argv: [
          undefined,
          undefined,
          'build',
          '-t',
          path.join(
            __dirname,
            'fixtures',
            'esbuild-no-entry-point-absolute.yaml'
          )
        ]
      }
    })
    await assert.rejects(expand(), {
      message: 'no entry point found for missing.lambdaHandler'
    })
  } finally {
    await unlink(
      path.join(__dirname, 'fixtures', 'esbuild-no-entry-point-absolute.yaml')
    )
  }
})

await test('two node lambda', async () => {
  let templatePath
  /* c8 ignore start */
  const writeMock = mock.fn()
  const unlinkMock = mock.fn()
  /* c8 ignore end */
  const expand = await esmock.p('../../src/expand.js', {
    'node:fs/promises': {
      // eslint-disable-next-line @typescript-eslint/require-await
      async writeFile(...arguments_) {
        writeMock(...arguments_)
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async unlink(...arguments_) {
        unlinkMock(...arguments_)
      }
    },
    'node:process': {
      argv: [
        undefined,
        undefined,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'esbuild-two-lambdas.yaml')
      ]
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async '../../src/spawn.js'(...arguments_) {
      templatePath = arguments_[1][arguments_[1].indexOf('-t') + 1]
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
        config: esbuild-config.yaml
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
        OutExtension: &ref_0
          - .js=.mjs
        Sourcemap: true
        Target: node18
        External: &ref_1
          - '@aws-sdk/*'
        Define: &ref_2
          - require.resolve=undefined
        Banner: &ref_3
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
        OutExtension: *ref_0
        Sourcemap: true
        Target: node18
        External: *ref_1
        Define: *ref_2
        Banner: *ref_3
        Platform: node
        EntryPoints:
          - app.ts
`
  )
  mock.restoreAll()
})

await test('lambda missing entry point', async () => {
  const expand = await esmock.p('../../src/expand.js', {
    'node:process': {
      argv: [
        undefined,
        undefined,
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

await test('non node lambda', async () => {
  let templatePath
  /* c8 ignore start */
  const writeMock = mock.fn()
  const unlinkMock = mock.fn()
  /* c8 ignore end */
  const expand = await esmock.p('../../src/expand.js', {
    'node:fs/promises': {
      // eslint-disable-next-line @typescript-eslint/require-await
      async writeFile(...arguments_) {
        writeMock(...arguments_)
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async unlink(...arguments_) {
        unlinkMock(...arguments_)
      }
    },
    'node:process': {
      argv: [
        undefined,
        undefined,
        'build',
        '-t',
        path.join(__dirname, 'fixtures', 'esbuild-non-node-lambda.yaml'),
        '--debug'
      ]
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async '../../src/spawn.js'(...arguments_) {
      templatePath = arguments_[1][arguments_[1].indexOf('-t') + 1]
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

await test('ignore rules', async (t) => {
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

  await t.test('non node runtime', async () => {
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

  await t.test('non zip package type', async () => {
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

  await t.test('inline code', async () => {
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

  await t.test('code uri object', async () => {
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

  await t.test('code uri s3 location', async () => {
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

  await t.test('fail if build method already specified', async () => {
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
      (error) => {
        assert.equal(
          error.message,
          'lambda HelloWorldFunction already has Metadata.BuildMethod specified'
        )
        return true
      }
    )

    assert.deepEqual(template, copy)
  })

  await t.test('fail if build properties already specified', async () => {
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
      (error) => {
        assert.equal(
          error.message,
          'lambda HelloWorldFunction already has Metadata.BuildProperties specified'
        )
        return true
      }
    )

    assert.deepEqual(template, copy)
  })

  await t.test('fail if missing handler', async () => {
    const template = structuredClone(baseTemplate)
    template.Resources.HelloWorldFunction.Properties.Runtime = 'nodejs20.x'
    template.Resources.HelloWorldFunction.Properties.Handler = undefined
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
      (error) => {
        assert.equal(error.message, 'lambda HelloWorldFunction missing handler')
        return true
      }
    )

    assert.deepEqual(template, copy)
  })

  await t.test('fail if missing code uri', async () => {
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
        parse() {}
      }),
      (error) => {
        assert.equal(error.message, 'lambda HelloWorldFunction missing codeUri')
        return true
      }
    )

    assert.deepEqual(template, copy)
  })
})
