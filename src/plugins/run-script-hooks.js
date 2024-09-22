// @ts-check

/**
 * @remarks
 * Pre and Post Script hooks for build, package, deploy, and delete.
 *
 * Run scripts with defined arguments.
 *
 * @example
 *
 * ```yaml
 * Metadata:
 *   expand:
 *     plugins:
 *       - '@starterstack/sam-expand/plugins/run-script-hooks'
 *   config:
 *     script:
 *       hooks:
 *         pre:delete
 *           - command: ../empty-s3-bucket.mjs
 *             args:
 *               - file:
 *                   location: ../settings.mjs
 *                   exportName: region
 *               - file:
 *                   location: ../settings.mjs
 *                   exportName: s3Bucket
 * ```
 * @module
 **/

import { resolveFile } from '../resolve.js'

/**
 * @typedef {'pre:sync' | 'post:sync' | 'pre:build' | 'post:build' | 'pre:package' | 'post:package' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' } Hook
 * @typedef {{ location: string, exportName: string, defaultValue?: string }} File
 * @typedef {{ command: string, args: Array<{ value?: string, file?: File }>}} Command
 **/

/** @typedef {import('./types.js').PluginSchema<{
 *    hooks: Record<keyof(Hook), Array<Command> | undefined>
 *  }>} HookSchema
 **/
/** @type {Hook[]} */
const hooks = [
  'pre:sync',
  'post:sync',
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
        // eslint-disable-next-line unicorn/no-array-reduce
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
                      },
                      additionalProperties: false
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
export const lifecycle = async function runScriptHook(options) {
  const { template, spawn, log, lifecycle } = options
  /** @type {HookSchema['Hooks']} */
  const hooks = template.Metadata.expand.config.script.hooks

  /** @type {Command[]} */
  const commands = hooks[lifecycle]

  if (commands) {
    for (const { command: spawnCommand, args } of commands) {
      /** @type {string[]} */
      const parseArguments = await Promise.all(
        args.map(async function map(argument) {
          /** @type {string[]} */
          const values = []
          const keyOrder = Object.keys(argument)

          for (const key of keyOrder) {
            if (key === 'value') {
              if (argument.value) {
                values.push(argument.value)
              }
            } else if (key === 'file' && argument.file) {
              const value = await resolveFile({
                ...options,
                ...argument.file
              })
              if (typeof value === 'string') {
                values.push(value)
              } else {
                const { location, exportName } = argument.file
                throw new TypeError(`${location}.${exportName} is missing`)
              }
            }
          }
          return values.join('')
        })
      )
      const spawnArguments = parseArguments.filter(Boolean)
      log('running script hook %O', {
        lifecycle,
        command: spawnCommand,
        args: spawnArguments
      })
      await spawn(spawnCommand, spawnArguments)
    }
  }
}
