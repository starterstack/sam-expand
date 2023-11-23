//@ts-check

import process from 'node:process'
import { yamlParse, yamlDump } from 'yaml-cfn'
import { stat, writeFile, readFile, unlink } from 'node:fs/promises'
import spawn from './spawn.js'
import path from 'node:path'
import { parseArgs } from 'node:util'
import os from 'node:os'
import { parse as tomlParse } from '@ltd/j-toml'
import Ajv from 'ajv'
import { betterAjvErrors } from '@apideck/better-ajv-errors'
import assert from 'node:assert/strict'

const windows = os.platform() === 'win32'

if (windows && !/bash/.test(String(process.env.SHELL))) {
  console.error('\x1B[91monly git bash supported in windows!\x1B[0m')
  process.exit(1)
}

/**
 * @typedef {import('ajv').JSONSchemaType<{ expand: { plugins?: string[], config?: Record<string, any>} } >} ExpandSchema
 * @typedef {'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand'} Lifecycle
 * @typedef {(options: {
 *   template: any,
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
    strict: false
  })

  if (values.help) {
    return await spawn('sam', ['--help'])
  }

  const configFileSettings = await getConfigFileSettings(
    values['config-file']?.toString()
  )
  const config = configFileSettings
    ? configFileSettings.type === 'toml'
      ? tomlParse(await readFile(configFileSettings.filePath, 'utf-8'))
      : yamlParse(await readFile(configFileSettings.filePath, 'utf-8'))
    : null

  const command = positionals?.[0]

  const configEnv = String(values.configEnv ?? 'default')

  /** @type {string | undefined } */
  const region =
    values.region ??
    config?.[configEnv ?? 'default']?.command?.parameters?.region ??
    config?.[configEnv ?? 'default']?.global?.parameters?.region ??
    process.env.AWS_REGION ??
    process.env.AWS_DEFAULT_REGION

  const baseDirectory = values?.['base-dir']?.toString()

  if (region) {
    process.env.AWS_REGION = region
  }

  const argv = process.argv.slice(2)

  const templateArgumentGiven = ['-t', '--template', '--template-file'].find(
    (x) => argv.includes(x)
  )

  const templateFile = String(
    values.template ?? values['template-file'] ?? (await findTemplateFile())
  )

  if (templateArgumentGiven && command === 'build') {
    argv.splice(argv.indexOf(templateArgumentGiven), 2)
  }

  /** @type {string[]} */
  const tempFiles = []

  const { template, expandedPath } = await expandAll({
    command,
    argv,
    templateFile,
    tempFiles,
    configEnv,
    region,
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
        lifecycle: `pre:${hookCommand}`,
        command,
        argv,
        region,
        configEnv,
        baseDirectory
      })
    }
    if (command === 'build') {
      argv.push(...['-t', expandedPath])
    }
  }
  await spawn('sam', argv)
  if (command) {
    if (hookCommand) {
      await runPlugins({
        template,
        lifecycle: `post:${hookCommand}`,
        command,
        argv,
        region,
        configEnv,
        baseDirectory
      })
    }
  }
  for (const tempFile of tempFiles) {
    await unlink(tempFile)
  }
}

/**
 * @param {{ templateFile: string, tempFiles: string[], command: string, argv: string[], region?: string, configEnv: string, baseDirectory?: string, nested?: boolean }} options
 * @return {Promise<{ expandedPath: string, template: any }>}
 **/
async function expandAll({
  templateFile,
  tempFiles,
  command,
  argv,
  configEnv,
  region,
  baseDirectory,
  nested
}) {
  if (!templateFile) {
    return {
      expandedPath: '',
      template: null
    }
  }
  const templateData = await readFile(templateFile, 'utf-8')
  const template = yamlParse(templateData)

  if (!nested) {
    if (template.Metadata?.expand) {
      await applyPluginSchemas({ template })
      const ajv = new Ajv.default({ strict: false, allErrors: true })
      const validate = ajv.compile(expandSchema)
      const metadata = {
        expand: template.Metadata.expand
      }
      if (!validate(metadata)) {
        /** @type {any} */
        const anySchema = expandSchema
        const betterErrors = betterAjvErrors({
          schema: anySchema,
          data: metadata,
          errors: validate.errors
        })
        console.log(betterErrors)
        throw new TypeError('schema validation failed')
      }
    }
  }

  await runPlugins({
    template,
    lifecycle: 'expand',
    command,
    argv,
    region,
    configEnv,
    baseDirectory
  })
  for (const value of Object.values(template.Resources)) {
    if (value.Type === 'AWS::Serverless::Application') {
      if (typeof value.Properties.Location === 'string') {
        const { expandedPath } = await expandAll({
          templateFile: value.Properties.Location,
          tempFiles,
          command,
          argv,
          configEnv,
          region,
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
    await writeFile(expandedPath, yamlDump(template))
    tempFiles.push(expandedPath)
    return { expandedPath, template }
  } else {
    return { expandedPath: templateFile, template }
  }
}

/**
 * @param {{ template: any, lifecycle: Lifecycle, command: string, argv: string[], region?: string, configEnv: string, baseDirectory?: string }} options
 * @returns {Promise<void>}
 **/
async function runPlugins({
  template,
  lifecycle,
  command,
  argv,
  region,
  configEnv,
  baseDirectory
}) {
  expandSchema.properties.expand.properties.config.properties ||= {}
  for (const plugin of template?.Metadata?.expand?.plugins ?? []) {
    const pluginPath = plugin?.startsWith('.')
      ? path.join(process.env.INIT_CWD ?? process.cwd(), plugin)
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
      parse: yamlParse,
      dump: yamlDump,
      lifecycle,
      spawn,
      command,
      argv,
      region,
      configEnv,
      baseDirectory
    })
  }
}

/**
 * @param {{ template: any }} options
 * @returns {Promise<void>}
 **/
async function applyPluginSchemas({ template }) {
  expandSchema.properties.expand.properties.config.properties ||= {}
  for (const plugin of template?.Metadata?.expand?.plugins ?? []) {
    const pluginPath = plugin?.startsWith('.')
      ? path.join(process.env.INIT_CWD ?? process.cwd(), plugin)
      : plugin
    /** @type {{ metadataConfig: string, schema: PluginSchema<unknown> }}*/
    const { metadataConfig, schema } = await import(pluginPath)
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
      await stat(filePath)
      return filePath
    } catch {}
  }
  return ''
}
