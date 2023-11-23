// @ts-check

import assert from 'node:assert/strict'

/** @typedef {'pre:build' | 'post:build' | 'pre:package' | 'post:package' | 'pre:deploy' | 'post:deploy'} Hook */
/** @typedef {import('./types.js').PluginSchema<{
 *    hooks: {
 *      [keyof(Hook)]?: Array<{ command: string, args: string[] }>
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
  'post:deploy'
]

export const metadataConfig = 'script'

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
                      type: 'string'
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

/** @type {import('../expand.js').Plugin} */
export const lifecycle = async function runScriptHook({
  template,
  spawn,
  lifecycle
}) {
  assert.ok(
    template?.Metadata?.expand?.config?.script?.hooks,
    'Metadata.expand.config.script.hooks missing'
  )

  const hooks = template.Metadata.expand.config.script.hooks
  const commands = hooks[lifecycle]

  if (commands) {
    for (const { command, args } of commands) {
      await spawn(command, args ?? [])
    }
  }
}
