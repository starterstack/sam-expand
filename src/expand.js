//@ts-check

/**
 * @summary
 * Expands the template using metadata defined in [SAM template](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html).
 *
 * @example
 * ```yaml
 * Metadata:
 *   expand:
 *     plugins:
 *       - '@starterstack/sam-expand/plugins/esbuild-node'
 *       - '@starterstack/sam-expand/plugins/run-script-hooks'
 *     config:
 *       esbuild:
 *         config: ./esbuild-config.yaml
 *       script:
 *         hooks:
 *           pre:build:
 *             - command: 'echo'
 *               args:
 *                 - value: 'pre build!'
 *           post:build:
 *             - command: 'echo'
 *               args:
 *                 - value: 'post build!'
 *   ```
 * @module
 **/

import process from 'node:process'
import { yamlParse, yamlDump } from 'yaml-cfn'
import { stat, writeFile, unlink } from 'node:fs/promises'
import spawn from './spawn.js'
import path from 'node:path'
import { parseArgs } from 'node:util'
import os from 'node:os'
import Ajv from 'ajv'
import freeze from './freeze.js'
import * as parse from './parse.js'

// @ts-ignore they got their type exports wrong so there are none :)
import betterAjvErrors from 'better-ajv-errors'
import assert from 'node:assert/strict'
import debugLog from './log.js'

const windows = os.platform() === 'win32'

if (windows && !/bash/.test(String(process.env['SHELL']))) {
  console.error('\x1B[91monly git bash supported in windows!\x1B[0m')
  process.exit(1)
}

/**
 * @typedef {'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'pre:expand' | 'expand' | 'post:expand'} Lifecycle
 * @typedef {Array<Lifecycle>} Lifecycles
 * @typedef {import('./log.js').Log} Log
 * @typedef {(options: {
 *   template: any,
 *   templateDirectory: string
 *   config: any,
 *   log: import('./log.js').Log,
 *   command: string
 *   argv: string[]
 *   parse: import('yaml-cfn').yamlParse,
 *   dump: import('yaml-cfn').yamlDump,
 *   spawn: import('./spawn.js').Spawn,
 *   configEnv: string,
 *   region?: string,
 *   baseDirectory?: string
 *   lifecycle: Lifecycle
 * }) => Promise<void>} Plugin
 **/

/**
 * @template T
 * @typedef {import('ajv').JSONSchemaType<T>} PluginSchema
 **/

/**
 * @return {Promise<void>}
 **/
export default async function expand() {
  const { values, positionals } = parseArgs({
    options: {
      help: {
        type: 'boolean'
      },
      debug: {
        type: 'boolean'
      },
      region: {
        type: 'string'
      },
      'config-env': {
        type: 'string'
      },
      'config-file': {
        type: 'string'
      },
      'stack-name': {
        type: 'string'
      },
      template: {
        type: 'string',
        short: 't'
      },
      'template-file': {
        type: 'string'
      },
      'base-dir': {
        type: 'string',
        short: 's'
      }
    },
    allowPositionals: true,
    strict: false,
    args: process.argv.slice(2)
  })

  const log =
    values.debug ?? process.env['DEBUG']
      ? debugLog
      : /** @type {Log} */ (_format, ..._args) => {}

  log('cli args %O', { args: { ...values } })
  const command = positionals?.[0] ?? ''

  if (!command || values.help) {
    const helpArgs = command ? [command, '--help'] : ['--help']
    log('sam %O', helpArgs)
    await spawn('sam', helpArgs)
    return
  }

  const baseDirectory = values?.['base-dir']?.toString()

  const argv = process.argv.slice(2)

  const templateArgumentGiven = ['-t', '--template', '--template-file'].find(
    (x) => argv.includes(x)
  )

  const templatePath =
    values['template']?.toString() ?? values['template-file']?.toString() ?? ''

  if (templatePath) {
    log('use template path %O', templatePath)
  }

  const templateFile = String(
    await findTemplateFile({
      filePath: templatePath,
      command
    })
  )

  if (!templateFile) {
    throw new Error('no template file found')
  }

  log('use template %O', templateFile)

  if (templateArgumentGiven && command === 'build') {
    argv.splice(argv.indexOf(templateArgumentGiven), 2)
  }

  const samConfigPath = await getSamConfigPath({
    filePath: values['config-file']?.toString(),
    templateDirectory: templateDirectoryFromFile(templateFile)
  })

  log('samConfig %O', samConfigPath)

  const config = samConfigPath ? await parse.samConfig(samConfigPath) : null

  const configEnv = String(values['config-env'] ?? 'default')
  log('configEnv %O', configEnv)

  /** @type {string | undefined } */
  const region =
    values.region ??
    config?.[configEnv]?.[command]?.parameters?.region ??
    config?.[configEnv]?.global?.parameters?.region ??
    process.env['AWS_REGION'] ??
    process.env['AWS_DEFAULT_REGION']

  log('region %O', region)

  /** @type {string[]} */
  const tempFiles = []

  const { template, expandedPath } = await expandAll({
    config,
    command,
    argv,
    templateFile,
    tempFiles,
    configEnv,
    region,
    log,
    baseDirectory
  })

  const hookCommand =
    command === 'build' ||
    command === 'package' ||
    command === 'deploy' ||
    command === 'delete'
      ? command
      : null

  const templateDirectory = templateDirectoryFromFile(templateFile)

  if (command && template) {
    if (hookCommand) {
      await runPlugins({
        template,
        templateDirectory,
        config,
        lifecycle: `pre:${hookCommand}`,
        command,
        argv,
        region,
        log,
        configEnv,
        baseDirectory
      })
    }
    if (command === 'build') {
      argv.push(...['-t', expandedPath])
    }
  }
  log('sam %O', argv)
  await spawn('sam', argv)
  if (command) {
    if (hookCommand) {
      await runPlugins({
        template,
        templateDirectory,
        config,
        lifecycle: `post:${hookCommand}`,
        command,
        argv,
        region,
        log,
        configEnv,
        baseDirectory
      })
    }
  }
  for (const tempFile of tempFiles) {
    log('deleting %O', tempFile)
    await unlink(tempFile)
  }
}

/**
 * @param {{ templateFile: string, tempFiles: string[], config: any, command: string, argv: string[], region?: string, log: Log, configEnv: string, baseDirectory?: string }} options
 * @return {Promise<{ expandedPath: string, template: any }>}
 **/
async function expandAll({
  templateFile,
  tempFiles,
  config,
  command,
  argv,
  configEnv,
  region,
  log,
  baseDirectory
}) {
  log('reading template %O', templateFile)
  const template = await parse.template(templateFile)
  const templateDirectory = templateDirectoryFromFile(templateFile)

  if (template.Metadata?.expand) {
    await validatePluginSchemas({
      templateDirectory,
      template: freeze(template),
      log
    })
  }

  /** @type {Lifecycle[]} */
  const expandLifecycles = ['pre:expand', 'expand', 'post:expand']

  for (const lifecycle of expandLifecycles) {
    await runPlugins({
      template: command === 'build' ? template : freeze(template),
      templateDirectory,
      config,
      lifecycle,
      command,
      argv,
      region,
      log,
      configEnv,
      baseDirectory
    })
  }

  for (const [key, value] of Object.entries(template.Resources ?? {})) {
    if (value.Type === 'AWS::Serverless::Application') {
      if (typeof value.Properties.Location === 'string') {
        const location = value.Properties.Location
        const locationPath =
          location.startsWith('.') || !location.startsWith('/')
            ? path.join(templateDirectory, location)
            : location
        const nestedLocation = await findFiles([locationPath])
        if (!nestedLocation) {
          throw new Error(`${value.Properties.Location} not found for ${key}`)
        }
        const { expandedPath } = await expandAll({
          templateFile: nestedLocation,
          tempFiles,
          config,
          command,
          argv,
          configEnv,
          region,
          log,
          baseDirectory
        })
        value.Properties.Location = expandedPath
      }
    }
  }

  if (command === 'build') {
    const extname = path.extname(templateFile)
    const templateBaseName = path.basename(templateFile, extname)
    const templateDirectory = path.dirname(templateFile)
    const expandedPath = path.join(
      templateDirectory,
      templateBaseName + '.expanded' + extname
    )

    log('writing expanded template %O', expandedPath)
    await writeFile(expandedPath, yamlDump(template))
    tempFiles.push(expandedPath)
    return { expandedPath, template: freeze(template) }
  } else {
    return { expandedPath: templateFile, template: freeze(template) }
  }
}

/**
 * @param {{ template: any, templateDirectory: string, config: any, lifecycle: Lifecycle, command: string, argv: string[], region?: string, log: Log, configEnv: string, baseDirectory?: string }} options
 * @returns {Promise<void>}
 **/
async function runPlugins({
  template,
  templateDirectory,
  config,
  lifecycle,
  command,
  argv,
  region,
  log,
  configEnv,
  baseDirectory
}) {
  for (const plugin of template?.Metadata?.expand?.plugins ?? []) {
    const pluginPath = plugin?.startsWith('.')
      ? path.join(templateDirectory, plugin)
      : plugin

    /** @type {{ lifecycle: Plugin, lifecycles: Lifecycles }}*/
    const { lifecycle: pluginModule, lifecycles } = await import(pluginPath)
    assert.equal(
      pluginModule?.constructor?.name,
      'AsyncFunction',
      `plugin: ${plugin} does not export const lifecycle = async function(plugin: Plugin) {}`
    )
    assert.ok(
      Array.isArray(lifecycles),
      `plugin: ${plugin} does not export const lifecycles: Lifecycles`
    )

    if (lifecycles.includes(lifecycle)) {
      await pluginModule({
        template,
        templateDirectory,
        parse: yamlParse,
        dump: yamlDump,
        lifecycle,
        spawn,
        command,
        config,
        argv,
        region,
        log,
        configEnv,
        baseDirectory
      })
    }
  }
}

/**
 * @param {{ templateDirectory: string, template: any, log: Log }} options
 * @returns {Promise<void>}
 **/
async function validatePluginSchemas({ templateDirectory, template, log }) {
  const plugins = template?.Metadata?.expand?.plugins ?? []

  const expandSchema = {
    type: 'object',
    required: [],
    properties: {
      expand: {
        required: plugins.length ? ['plugins'] : [],
        type: 'object',
        properties: {
          plugins: {
            type: 'array',
            items: {
              type: 'string'
            },
            additionalProperties: false
          },
          config: {
            type: 'object',
            additionalProperties: false,
            required: [],
            properties: {}
          }
        },
        additionalProperties: false
      }
    }
  }

  for (const plugin of plugins) {
    const pluginPath = plugin?.startsWith('.')
      ? path.join(templateDirectory, plugin)
      : plugin

    log('import plugin %O', { pluginPath })
    /** @type {{ metadataConfig: string, schema: PluginSchema<unknown> }}*/
    const { metadataConfig, schema } = await import(pluginPath)

    if (metadataConfig || schema) {
      log('plugin apply schema %O', { plugin, metadataConfig })
      assert.equal(
        typeof metadataConfig,
        'string',
        `plugin: ${plugin} does not export const metadataConfig: string`
      )
      assert.equal(
        typeof schema,
        'object',
        `plugin: ${plugin} does not export const schema: PluginSchema<T>`
      )

      /** @type {string[]} */
      const required = expandSchema.properties.expand.properties.config.required
      if (!required.includes(metadataConfig)) {
        required.push(metadataConfig)
      }

      /** @type {Record<string, any>} */
      const configProperties =
        expandSchema.properties.expand.properties.config.properties
      if (!configProperties[metadataConfig]) {
        configProperties[metadataConfig] = schema
      } else {
        throw new Error(
          `duplicate config ${metadataConfig} found in plugin: ${plugin}`
        )
      }
    }
  }

  const ajv = new Ajv.default({ strict: false, allErrors: true })
  const validate = ajv.compile(expandSchema)
  const metadata = {
    expand: template.Metadata.expand
  }
  if (!validate(metadata)) {
    const betterErrors = betterAjvErrors(
      expandSchema,
      metadata,
      validate.errors,
      { indent: 2 }
    )
    console.error(betterErrors)
    throw new TypeError('schema validation failed')
  }
}

/** @param {{ filePath: string | undefined, templateDirectory: string }} options
 * @returns {Promise<null | string>}
 **/
async function getSamConfigPath({ filePath, templateDirectory }) {
  if (filePath) {
    if (filePath.startsWith('.') || !filePath.startsWith('/')) {
      return path.join(templateDirectory, filePath)
    } else {
      return filePath
    }
  } else {
    return await findFiles(
      ['./samconfig.toml', './samconfig.yaml', './samconfig.yml'].map((file) =>
        path.join(templateDirectory, file)
      )
    )
  }
}

/**
 * @param {{ filePath: string, command: string }} options
 * @returns {Promise<string>}
 **/
async function findTemplateFile({ filePath, command }) {
  return await findFiles(
    [
      filePath,
      ['package', 'deploy'].includes(command)
        ? '.aws-sam/build/template.yaml'
        : '',
      './template.yaml',
      './template.yml'
    ].filter(Boolean)
  )
}

/** @param {string[]} filePaths }
 * @returns {Promise<string>} */
async function findFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      const fullPath =
        filePath.startsWith('.') || !filePath.startsWith('/')
          ? path.join(process.env['INIT_CWD'] ?? process.cwd(), filePath)
          : filePath
      await stat(fullPath)
      return fullPath
    } catch {}
  }
  return ''
}

/**
 * @param {string} templatePath
 * @returns {string}
 **/
function templateDirectoryFromFile(templatePath) {
  const directory = path.dirname(templatePath)
  if (directory.endsWith('build')) {
    return path.resolve(path.join(directory, '..', '..'))
  } else {
    return path.resolve(directory)
  }
}
