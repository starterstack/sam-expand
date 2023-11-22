//@ts-check

import process from 'node:process'
import { yamlParse, yamlDump } from 'yaml-cfn'
import { stat, writeFile, readFile, unlink } from 'node:fs/promises'
import spawn from './spawn.js'
import path from 'node:path'
import { parseArgs } from 'node:util'
import os from 'node:os'
import { parse as tomlParse } from '@ltd/j-toml'

const windows = os.platform() === 'win32'

if (windows && !/bash/.test(String(process.env.SHELL))) {
  console.error('\x1B[91monly git bash supported in windows!\x1B[0m')
  process.exit(1)
}

/**
 * @typedef {'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand'} Lifecycle
 * @typedef {(options: {
 *   template: any,
 *   command: string
 *   argv: string[]
 *   parse: import('yaml-cfn').yamlParse,
 *   dump: import('yaml-cfn').yamlDump,
 *   spawn: import('./spawn.js').Spawn,
 *   configEnv: string,
 *   region: string,
 *   baseDirectory?: string
 *   lifecycle: Lifecycle
 * }) => Promise<void>} Plugin
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
  const region = String(
    values.region ??
      process.env.AWS_REGION ??
      config?.[configEnv ?? 'default']?.command?.parameters?.region ??
      config?.[configEnv ?? 'default']?.global?.parameters?.region ??
      process.env.AWS_DEFAULT_REGION ??
      'us-east-1'
  )
  const baseDirectory = values?.['base-dir']?.toString()

  process.env.AWS_REGION = region

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
 * @param {{ templateFile: string, tempFiles: string[], command: string, argv: string[], region: string, configEnv: string, baseDirectory?: string }} options
 * @return {Promise<{ expandedPath: string, template: any }>}
 **/
async function expandAll({
  templateFile,
  tempFiles,
  command,
  argv,
  configEnv,
  region,
  baseDirectory
}) {
  if (!templateFile) {
    return {
      expandedPath: '',
      template: null
    }
  }
  const templateData = await readFile(templateFile, 'utf-8')
  const template = yamlParse(templateData)

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
    await writeFile(expandedPath, yamlDump(template))
    tempFiles.push(expandedPath)
    return { expandedPath, template }
  } else {
    return { expandedPath: templateFile, template }
  }
}

/**
 * @param {{ template: any, lifecycle: Lifecycle, command: string, argv: string[], region: string, configEnv: string, baseDirectory?: string }} options
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
  for (const plugin of template?.Metadata?.expand?.plugins ?? []) {
    const pluginPath = plugin?.startsWith('.')
      ? path.join(process.env.INIT_CWD ?? process.cwd(), plugin)
      : plugin
    /** @type {{ default: Plugin }}*/
    const { default: pluginModule } = await import(pluginPath)
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
