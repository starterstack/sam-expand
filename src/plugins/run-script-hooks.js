// @ts-check

import { resolveFile, resolveCloudFormationOutput } from '../resolve.js'

/**
 * @typedef {'pre:build' | 'post:build' | 'pre:package' | 'post:package' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' } Hook
 * @typedef {{ stackRegion?: string, stackName: string, outputKey: string, defaultValue?: string }} CloudFormation
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
                            stackName: { type: 'string' },
                            outputKey: { type: 'string' },
                            defaultValue: { type: 'string', nullable: true }
                          },
                          required: ['stackName', 'outputKey'],
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
  spawn,
  parse,
  region,
  log,
  lifecycle
}) {
  /** @type {HookSchema['Hooks']} */
  const hooks = template.Metadata.expand.config.script.hooks

  /** @type {Command[]} */
  const commands = hooks[lifecycle]

  if (commands) {
    for (const { command, args } of commands) {
      /** @type {Array<string | undefined>} */
      const parsedArguments = await Promise.all(
        args.map((arg) => {
          if (arg.value) {
            return arg.value
          } else if (arg.file) {
            const { location, defaultValue, exportName } = arg.file
            return resolveFile({ location, defaultValue, exportName, parse })
          } else if (arg.cloudFormation) {
            const { stackName, defaultValue, stackRegion, outputKey } =
              arg.cloudFormation
            if (!region && !stackRegion) {
              throw new Error(
                `${stackName}.${outputKey} can't be resolved, missing region`
              )
            }
            return resolveCloudFormationOutput({
              stackName,
              defaultValue,
              stackRegion: String(stackRegion ?? region),
              outputKey
            })
          } else {
            return
          }
        })
      )
      /** @type {string[]} */
      const spawnArgs = parsedArguments.filter(Boolean).map(String)
      log('running script hook %O', { lifecycle, command, args: spawnArgs })
      await spawn(command, spawnArgs)
    }
  } else {
    log('skipping script hook %O', { lifecycle })
  }
}
