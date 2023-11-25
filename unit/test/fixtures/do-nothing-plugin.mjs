// @ts-check

export const metadataConfig = 'do-nothing'

/** @type {import('../../../src/plugins/types.js').PluginSchema<{}>} HookSchema **/
export const schema = {
  type: 'object',
  nullable: true,
  additionalProperties: false
}

/** @type {import('../../../src/expand.js').Plugin} */
export const lifecycle = async function doNothing() { }

/** @type {import('../../../src/plugins/types.js').Lifecycles} Lifecycles **/
export const lifecycles = [
  'expand',
  'pre:build',
  'post:build',
  'pre:package',
  'post:package',
  'pre:deploy',
  'post:deploy',
  'pre:delete',
  'post:delete'
]
