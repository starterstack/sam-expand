//@ts-check

import process from 'node:process'
import { yamlParse, schema as yamlSchema } from 'yaml-cfn'
import { dump } from 'js-yaml'
import { stat, writeFile, readFile, unlink } from 'node:fs/promises'
import spawn from './spawn.js'
import path from 'node:path'
import { parseArgs } from 'node:util'
import os from 'node:os'
import { parse as tomlParse } from '@ltd/j-toml'
import Ajv from 'ajv'
import { betterAjvErrors } from '@apideck/better-ajv-errors'
import assert from 'node:assert/strict'
import debugLog from './log.js'

const windows = os.platform() === 'win32'

if (windows && !/bash/.test(String(process.env.SHELL))) {
  console.error('\x1B[91monly git bash supported in windows!\x1B[0m')
  process.exit(1)
}

/**
 * @typedef {import('ajv').JSONSchemaType<{ expand: { plugins?: string[], config?: Record<string, any>} } >} ExpandSchema
 * @typedef {'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand'} Lifecycle
 * @typedef {import('./log.js').Log} Log
 * @typedef {(options: {
 *   template: any,
 *   templateDirectory: string
 *   config: any,
 *   log: import('./log.js').Log,
 *   command: string
 *   argv: string[]
 *   parse: import('yaml-cfn').yamlParse,
 *   dump: (o: any) => string,
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

/** @type {ExpandSchema} */
const expandSchema = {
  type: 'object',
  required: [],
  properties: {
    expand: {
      required: [],
      type: 'object',
      properties: {
        plugins: {
          type: 'array',
          items: {
            type: 'string'
          },
          additionalProperties: false,
          nullable: true
        },
        config: {
          type: 'object',
          additionalProperties: false,
          nullable: true
        }
      },
      additionalProperties: false
    }
  }
}

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
    values.debug ?? process.env.DEBUG
      ? debugLog
      : /** @type {Log} */ (_format, ..._args) => {}

  log('cli args %O', { args: { ...values } })

  if (values.help) {
    log('sam %O', ['--help'])
    return await spawn('sam', ['--help'])
  }

  const configFileSettings = await getConfigFileSettings(
    values['config-file']?.toString()
  )

  log('config settings %O', configFileSettings)

  const config = configFileSettings
    ? configFileSettings.type === 'toml'
      ? tomlParse(await readFile(configFileSettings.filePath, 'utf-8'))
      : yamlParse(await readFile(configFileSettings.filePath, 'utf-8'))
    : null

  const command = positionals?.[0]

  const configEnv = String(values['config-env'] ?? 'default')
  log('configEnv %O', configEnv)

  /** @type {string | undefined } */
  const region =
    values.region ??
    config?.[configEnv ?? 'default']?.[command]?.parameters?.region ??
    config?.[configEnv ?? 'default']?.global?.parameters?.region ??
    process.env.AWS_REGION ??
    process.env.AWS_DEFAULT_REGION

  log('region %O', region)

  const baseDirectory = values?.['base-dir']?.toString()

  const argv = process.argv.slice(2)

  const templateArgumentGiven = ['-t', '--template', '--template-file'].find(
    (x) => argv.includes(x)
  )

  const templateFile = String(
    values.template ?? values['template-file'] ?? (await findTemplateFile())
  )

  log('use template %O', templateFile)

  if (templateArgumentGiven && command === 'build') {
    argv.splice(argv.indexOf(templateArgumentGiven), 2)
  }

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

  if (command && template) {
    if (hookCommand) {
      await runPlugins({
        template,
        templateDirectory: path.dirname(templateFile),
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
        templateDirectory: path.dirname(templateFile),
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
 * @param {{ templateFile: string, tempFiles: string[], config: any, command: string, argv: string[], region?: string, log: Log, configEnv: string, baseDirectory?: string, nested?: boolean }} options
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
  baseDirectory,
  nested
}) {
  if (!templateFile) {
    return {
      expandedPath: '',
      template: null
    }
  }
  log('reading template %O', templateFile)
  const templateData = await readFile(templateFile, 'utf-8')
  const template = yamlParse(templateData)

  if (!nested) {
    if (template.Metadata?.expand) {
      await applyPluginSchemas({
        templateDirectory: path.dirname(templateFile),
        template,
        log
      })
      const ajv = new Ajv.default({ strict: false, allErrors: true })
      const validate = ajv.compile(expandSchema)
      const metadata = {
        expand: template.Metadata.expand
      }
      if (!validate(metadata)) {
        /** @type {any} */
        const anySchema = expandSchema
        try {
          const betterErrors = betterAjvErrors({
            schema: anySchema,
            data: metadata,
            errors: validate.errors
          })
          console.error(betterErrors)
        } catch {
          console.error(validate.errors)
        }
        throw new TypeError('schema validation failed')
      }
    }
  }

  await runPlugins({
    template,
    templateDirectory: path.dirname(templateFile),
    config,
    lifecycle: 'expand',
    command,
    argv,
    region,
    log,
    configEnv,
    baseDirectory
  })
  for (const value of Object.values(template.Resources ?? {})) {
    if (value.Type === 'AWS::Serverless::Application') {
      if (typeof value.Properties.Location === 'string') {
        const { expandedPath } = await expandAll({
          templateFile: await findFiles([value.Properties.Location]),
          tempFiles,
          config,
          command,
          argv,
          configEnv,
          region,
          log,
          baseDirectory,
          nested: true
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
    return { expandedPath, template }
  } else {
    return { expandedPath: templateFile, template }
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
  expandSchema.properties.expand.properties.config.properties ||= {}
  for (const plugin of template?.Metadata?.expand?.plugins ?? []) {
    if (typeof plugin !== 'string') continue
    const pluginPath = plugin?.startsWith('.')
      ? path.join(templateDirectory, plugin)
      : plugin
    /** @type {{ lifecycle: Plugin }}*/
    const { lifecycle: pluginModule } = await import(pluginPath)
    assert.equal(
      pluginModule?.constructor?.name,
      'AsyncFunction',
      `plugin: ${plugin} does not export const lifecycle = async function(plugin: Plugin) {}`
    )
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

/**
 * @param {{ templateDirectory: string, template: any, log: Log }} options
 * @returns {Promise<void>}
 **/
async function applyPluginSchemas({ templateDirectory, template, log }) {
  expandSchema.properties.expand.properties.config.properties ||= {}
  for (const plugin of template?.Metadata?.expand?.plugins ?? []) {
    if (typeof plugin !== 'string') continue
    const pluginPath = plugin?.startsWith('.')
      ? path.join(templateDirectory, plugin)
      : plugin
    /** @type {{ metadataConfig: string, schema: PluginSchema<unknown> }}*/
    const { metadataConfig, schema } = await import(pluginPath)
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
    if (
      !expandSchema.properties.expand.properties.config.properties[
        metadataConfig
      ]
    ) {
      expandSchema.properties.expand.properties.config.properties[
        metadataConfig
      ] = schema
    } else {
      throw new Error(
        `duplicate config ${metadataConfig} found in plugin: ${plugin}`
      )
    }
  }
}

/** @param { string | undefined } filePath
 * @returns {Promise<null | { filePath: string, type: 'yaml' | 'toml' }>}
 **/
async function getConfigFileSettings(filePath) {
  filePath ||= await findFiles([
    'samconfig.toml',
    'samconfig.yaml',
    'samconfig.yml'
  ])
  if (!filePath) return null
  const type = path.extname(filePath) === '.toml' ? 'toml' : 'yaml'
  return { filePath, type }
}

/** @returns {Promise<string>} */
async function findTemplateFile() {
  return await findFiles(['template.yaml', 'template.yml'])
}

/** @param {string[]} filePaths }
 * @returns {Promise<string>} */
async function findFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      const fullPath = path.join(
        process.env.INIT_CWD ?? process.cwd(),
        filePath
      )
      await stat(fullPath)
      return fullPath
    } catch {}
  }
  return ''
}

/**
 * @param {any} template
 * @returns {string}
 **/

function yamlDump(template) {
  return dump(template, { schema: yamlSchema, noRefs: true })
}
