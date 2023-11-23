// @ts-check

export const metadataConfig = 'do-nothing'

/** @type {import('../../src/plugins/types.js').PluginSchema<{}>} HookSchema **/
export const schema = {
  type: 'object',
  nullable: true,
  additionalProperties: false
}

/** @type {import('../../src/expand.js').Plugin} */
export const lifecycle = async function doNothing() {
}
