// @ts-check

import { resolveFile, resolveCloudFormationOutput } from '../resolve.js'
import { parseArgs } from 'node:util'

/**
 * @typedef {'pre:build' | 'post:build' | 'pre:package' | 'post:package' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' } Hook
 * @typedef {{ stackRegion?: string, stackName?: string, self?: boolean, outputKey: string, defaultValue?: string }} CloudFormation
 * @typedef {{ location: string, exportName: string, defaultValue?: string }} File
 * @typedef {{ command: string, args: Array<{ value?: string, file?: File, cloudFormation?: CloudFormation}> }} Command
 **/

/** @typedef {import('./types.js').PluginSchema<{
 *    hooks: {
 *      [keyof(Hook)]?: Array<Command>
 *    }
 *  }>} HookSchema
 **/
/** @type {Hook[]} */
const hooks = [
  'pre:build',
  'post:build',
  'pre:package',
  'post:package',
  'pre:deploy',
  'post:deploy',
  'pre:delete',
  'post:delete'
]

export const metadataConfig = 'script'

/** @type {import('./types.js').Lifecycles} */
export const lifecycles = hooks

/** @type {HookSchema} */
export const schema = {
  type: 'object',
  properties: {
    hooks: {
      type: 'object',
      properties: {
        ...hooks.reduce(
          /**
           * @param {HookSchema['hooks']} sum
           * @param {Hook} hook
           * @returns {HookSchema['hooks']}
           **/

          (sum, hook) => {
            sum[hook] = {
              type: 'array',
              minLength: 1,
              nullable: true,
              items: {
                type: 'object',
                properties: {
                  command: {
                    type: 'string'
                  },
                  args: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        value: {
                          type: 'string'
                        },
                        cloudFormation: {
                          type: 'object',
                          properties: {
                            stackRegion: { type: 'string', nullable: true },
                            stackName: { type: 'string', nullable: true },
                            self: { type: 'boolean', nullable: true },
                            outputKey: { type: 'string' },
                            defaultValue: { type: 'string', nullable: true }
                          },
                          required: ['outputKey'],
                          additionalProperties: false,
                          nullable: true
                        },
                        file: {
                          type: 'object',
                          properties: {
                            location: { type: 'string' },
                            exportName: { type: 'string' },
                            defaultValue: { type: 'string', nullable: true }
                          },
                          required: ['location', 'exportName'],
                          additionalProperties: false,
                          nullable: true
                        }
                      }
                    },
                    minItems: 0
                  }
                },
                required: ['command'],
                additionalProperties: false
              }
            }
            return sum
          },
          {}
        )
      },
      additionalProperties: false
    }
  },
  required: ['hooks'],
  additionalProperties: false,
  nullable: false
}

/** @type {import('./types.js').Plugin} */
export const lifecycle = async function runScriptHook({
  template,
  templateDirectory,
  spawn,
  parse,
  region,
  log,
  lifecycle,
  argv,
  configEnv,
  config,
  command
}) {
  /** @type {HookSchema['Hooks']} */
  const hooks = template.Metadata.expand.config.script.hooks

  /** @type {Command[]} */
  const commands = hooks[lifecycle]

  if (commands) {
    for (const { command: spawnCommand, args } of commands) {
      /** @type {string[]} */
      const spawnArgs = (
        await Promise.all(
          args.map(async function map(arg) {
            /** @type {string[]} */
            const values = []
            const keyOrder = Object.keys(arg)

            for (const key of keyOrder) {
              if (key === 'value') {
                if (arg.value) {
                  values.push(arg.value)
                }
              } else if (key === 'file') {
                if (arg.file) {
                  const { location, defaultValue, exportName } = arg.file
                  const value = await resolveFile({
                    location,
                    templateDirectory,
                    defaultValue,
                    exportName,
                    parse,
                    region,
                    lifecycle,
                    configEnv,
                    command
                  })
                  if (typeof value === 'string') {
                    values.push(value)
                  } else {
                    throw new Error(`${location}.${exportName} is missing`)
                  }
                }
              } else if (key === 'cloudFormation') {
                if (arg.cloudFormation) {
                  const {
                    self: isSelf,
                    stackName,
                    defaultValue,
                    stackRegion,
                    outputKey
                  } = arg.cloudFormation
                  if (!region && !stackRegion) {
                    throw new Error(
                      `${stackName}.${outputKey} can't be resolved, missing region`
                    )
                  }
                  const stackNameOrSelf = stackName
                    ? String(stackName)
                    : isSelf
                      ? inferStackName({ argv, command, config, configEnv })
                      : null

                  if (!stackNameOrSelf) {
                    throw new Error(`${outputKey} is missing stackName`)
                  }
                  const value = await resolveCloudFormationOutput({
                    stackName: stackNameOrSelf,
                    defaultValue,
                    stackRegion: String(stackRegion ?? region),
                    outputKey
                  })

                  if (typeof value === 'string') {
                    values.push(value)
                  } else {
                    throw new Error(
                      `${stackNameOrSelf}.${outputKey} is missing`
                    )
                  }
                }
              }
            }
            return values.join('')
          })
        )
      ).filter(Boolean)
      log('running script hook %O', {
        lifecycle,
        command: spawnCommand,
        args: spawnArgs
      })
      await spawn(spawnCommand, spawnArgs)
    }
  }
}

/**
 * @param {{ argv: string[], command: string, config: any, configEnv: string }} options
 * @returns {string | undefined}
 **/

function inferStackName({ argv, command, config, configEnv }) {
  const { values } = parseArgs({
    options: {
      'stack-name': {
        type: 'string'
      }
    },
    allowPositionals: true,
    strict: false,
    args: argv
  })
  const stackName =
    values['stack-name'] ??
    config?.[configEnv]?.[command]?.parameters?.stack_name ??
    config?.[configEnv]?.global?.parameters?.stack_name
  return stackName
}
