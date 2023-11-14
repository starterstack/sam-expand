//@ts-check

import process from 'node:process'
import { yamlParse, yamlDump } from 'yaml-cfn'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import spawn from './spawn.js'
import path from 'node:path'

/**
 * @typedef {'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand'} Lifecycle
 * @typedef {(options: {
 *   template: any,
 *   command: string
 *   parse: import('yaml-cfn').yamlParse,
 *   dump: import('yaml-cfn').yamlDump,
 *   spawn: import('./spawn.js').Spawn,
 *   lifecycle: Lifecycle
 * }) => Promise<void>} Plugin
 **/

/**
 * @return {Promise<void>}
 **/
export default async function expand() {
  const argv = process.argv.slice(2)

  const subCommand = argv.at(0)

  if (subCommand === 'sam') {
    const command = argv.at(1)?.match(/^[a-z].+/)?.[0] ?? ''
    const templateArgumentGiven = ['-t', '--template', '--template-file'].find(
      (x) => argv.includes(x)
    )

    const templateFile = templateArgumentGiven
      ? argv[argv.indexOf(templateArgumentGiven) + 1]
      : 'template.yaml'

    if (templateArgumentGiven && command === 'build') {
      argv.splice(argv.indexOf(templateArgumentGiven), 2)
    }

    const tempFiles = []
    const { template, expandedPath } = await expandAll({
      command,
      templateFile,
      tempFiles
    })

    const hookCommand =
      command === 'build' ||
      command === 'package' ||
      command === 'deploy' ||
      command === 'delete'
        ? command
        : null

    if (command) {
      if (hookCommand) {
        await runPlugins({ template, lifecycle: `pre:${hookCommand}`, command })
      }
      if (command === 'build') {
        argv.push(...['-t', expandedPath])
      }
    }
    await spawn('sam', argv.slice(1))
    if (command) {
      if (hookCommand) {
        await runPlugins({
          template,
          lifecycle: `post:${hookCommand}`,
          command
        })
      }
    }
    for (const tempFile of tempFiles) {
      await unlink(tempFile)
    }
  } else {
    console.log('usage: sam-expand sam COMMAND [ARGS]')
    process.exit(1)
  }
}

/**
 * @param {{ templateFile: string, tempFiles: string[], command: string }} options
 * @return {Promise<{ expandedPath: string, template: any }>}
 **/
async function expandAll({ templateFile, tempFiles, command }) {
  const templateData = await readFile(templateFile, 'utf-8')
  const template = yamlParse(templateData)
  await runPlugins({ template, lifecycle: 'expand', command })
  for (const value of Object.values(template.Resources)) {
    if (value.Type === 'AWS::Serverless::Application') {
      if (typeof value.Properties.Location === 'string') {
        const { expandedPath } = await expandAll({
          templateFile: value.Properties.Location,
          tempFiles,
          command
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
 * @param {{ template: any, lifecycle: Lifecycle, command: string }} options
 * @returns {Promise<void>}
 **/
async function runPlugins({ template, lifecycle, command }) {
  for (const plugin of template.Metadata?.plugins ?? []) {
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
      command
    })
  }
}
