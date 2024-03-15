// @ts-check

/**
 * @remarks
 * Override values from json/yaml files, or custom .mjs files.
 * with --parameter-overrides for sam build, sync, and deploy.
 *
 * @summary
 * Override parameter values.
 *
 * @example
 *
 * ```yaml
 * Parameters:
 *   GitHubRepoOwner:
 *     Type: String
 *   GitHubRepo:
 *     Type: String
 * Metadata:
 *   expand:
 *     plugins:
 *       - '@starterstack/sam-expand/plugins/parameter-overrides'
 *   config:
 *     parameterOverrides:
 *       - location: ../settings.json
 *         overrides:
 *           - name: GitHubRepoOwner
 *             exportName: owner
 *           - name: GitHubRepo
 *             exportName: repo
 * ```
 * @module
 **/

import { resolveFile } from '../resolve.js'
import shouldInline from './should-inline-parameter-value.js'
import inlineParameters from './inline-parameters.js'

/** @type {import('./types.js').Lifecycles} */
export const lifecycles = ['expand']

/**
 * @typedef {{ name: string, exportName: string, defaultValue?: string }} Override
 * @typedef {Array<{ location: string, overrides: Array<Override> }>} Schema
 **/

/**
 * @type {import('./types.js').PluginSchema<Schema>}
 */

export const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      location: { type: 'string' },
      overrides: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            exportName: { type: 'string' },
            defaultValue: { type: 'string', nullable: true }
          },
          required: ['name', 'exportName'],
          additionalProperties: false
        }
      }
    },
    required: ['location', 'overrides'],
    additionalProperties: false
  }
}

export const metadataConfig = 'parameterOverrides'

/** @type {import('./types.js').Plugin} */
export const lifecycle = async function expand(options) {
  const { template, argv, command } = options
  if (command !== 'build' && command !== 'deploy' && command !== 'sync') {
    return
  }

  /** @type {Schema} */
  const parameterOverrides =
    template.Metadata.expand.config?.['parameterOverrides']

  /** @type {Array<{ location: string, override: Override }>} */
  const inlinedParameters = []

  for (const { location, overrides } of parameterOverrides) {
    for (const override of overrides) {
      if (!template.Parameters?.[override.name]) {
        throw new Error(`parameter ${override.name} not found in template`)
      }
      const value = await resolveFile({
        location,
        exportName: override.exportName,
        defaultValue: override.defaultValue,
        ...options
      })
      if (value === undefined) {
        throw new TypeError(
          `parameter ${override.name} resolver ${location} missing ${override.exportName}`
        )
      }

      if (shouldInline(value)) {
        if (options.lifecycle === 'expand') {
          inlineParameters({ name: override.name, value, template })
          inlinedParameters.push({ location, override })
        }
      } else {
        addParameterArgument({ argv, name: override.name, value })
      }
    }
  }

  cleanedupInlinedParametersForLint({
    inlinedParameters,
    parameterOverrides,
    template
  })
}

/**
 * @param {{ inlinedParameters: Array<{ location: string, override: Override }>, parameterOverrides: Schema, template: any }} options
 * @returns {void}
 **/
function cleanedupInlinedParametersForLint({
  inlinedParameters,
  parameterOverrides,
  template
}) {
  for (const { location, override } of inlinedParameters) {
    const parameter = parameterOverrides.find((x) => x.location === location)
    if (parameter) {
      delete template.Parameters[override.name]
      parameter.overrides.splice(parameter.overrides.indexOf(override), 1)
    }
  }
}

/**
 * @param {{ argv: string[], name: string, value: string }} options
 * @returns {void}
 **/

function addParameterArgument({ argv, name, value }) {
  if (!argv.includes('--parameter-overrides')) {
    argv.push('--parameter-overrides')
  }
  const parameterIndex = argv.findIndex((x) => x.startsWith(`${name}=`))

  if (parameterIndex === -1) {
    const parameterOverridesIndex = argv.indexOf('--parameter-overrides')
    argv.splice(parameterOverridesIndex + 1, 0, `${name}='${value}'`)
  } else {
    argv.splice(parameterIndex, 1, `${name}='${value}'`)
  }
}
