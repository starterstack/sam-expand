// @ts-check

import { resolveFile } from '../resolve.js'

/**
 * @typedef {'pre:build' | 'post:build' | 'pre:package' | 'post:package' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' } Hook
 * @typedef {{ location: string, exportName: string, defaultValue?: string }} File
 * @typedef {{ command: string, args: Array<{ value?: string, file?: File }>}} Command
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
  configEnv,
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
