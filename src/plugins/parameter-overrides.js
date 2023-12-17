// @ts-check

import { resolveFile } from '../resolve.js'

/** @type {import('./types.js').Lifecycles} */
export const lifecycles = ['pre:deploy']

/**
 * @typedef {{ location: string, exportName: string, defaultValue?: string }} File
 * @typedef {Array<{ name: string, file?: File }>} Schema
 **/

/**
 * @type {import('./types.js').PluginSchema<Schema>}
 */

export const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string' },
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
      },
      additionalProperties: false
    },
    required: ['name'],
    additionalProperties: false
  }
}

export const metadataConfig = 'parameterOverrides'

/** @type {import('./types.js').Plugin} */
export const lifecycle = async function expand({
  template,
  command,
  lifecycle,
  configEnv,
  parse,
  templateDirectory,
  region,
  argv
}) {
  /** @type {Schema} */
  const parameterOverrides =
    template.Metadata.expand.config?.['parameterOverrides']

  for (const parameter of parameterOverrides) {
    if (!template.Parameters?.[parameter.name]) {
      throw new Error(`parameter ${parameter.name} not found in template`)
    }
    if (parameter.file) {
      const { exportName, defaultValue, location } = parameter.file
      const value = await resolveFile({
        location,
        templateDirectory,
        exportName,
        defaultValue,
        parse,
        command,
        lifecycle,
        configEnv,
        region
      })
      if (typeof value === 'undefined') {
        throw new Error(
          `parameter ${parameter.name} resolver ${parameter.file.location} missing ${exportName}`
        )
      }
      addParameter({ argv, name: parameter.name, value })
    }
  }
}

/**
 * @param {{ argv: string[], name: string, value: string }} options
 * @returns {void}
 **/

function addParameter({ argv, name, value }) {
  if (!argv.includes('--parameter-overrides')) {
    argv.push('--parameter-overrides')
  }
  const parameterIndex = argv.findIndex((x) => x.startsWith(`${name}=`))

  if (parameterIndex === -1) {
    const parameterOverridesIndex = argv.indexOf('--parameter-overrides')
    argv.splice(parameterOverridesIndex + 1, 0, `${name}=${value}`)
  } else {
    argv.splice(parameterIndex, 1, `${name}=${value}`)
  }
}
