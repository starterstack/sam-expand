// @ts-check

/**
 * @remarks
 * Override values from json/yaml files, or custom .mjs files.
 * with --parameter-overrides for sam build, and deploy.
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

/** @type {import('./types.js').Lifecycles} */
export const lifecycles = ['expand', 'pre:build', 'pre:deploy']

/**
 * @typedef {{ name: string, exportName: string, defaultValue?: string, inlineRef?: boolean }} Override
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
            defaultValue: { type: 'string', nullable: true },
            inlineRef: { type: 'boolean', nullable: true }
          },
          required: ['name', 'exportName'],
          additionalProperties: false,
          nullable: true
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
  if (command !== 'build' && command !== 'deploy') {
    return
  }
  /** @type {Schema} */
  const parameterOverrides =
    template.Metadata.expand.config?.['parameterOverrides']

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
      if (override.inlineRef) {
        if (options.lifecycle === 'expand') {
          inlineParameterRefs({ name: override.name, value, template })
        }
      } else {
        addParameterArgument({ argv, name: override.name, value })
      }
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
    argv.splice(parameterOverridesIndex + 1, 0, `${name}=${value}`)
  } else {
    argv.splice(parameterIndex, 1, `${name}=${value}`)
  }
}

/**
 * @param {{ name: string, value: string, template: any }} options
 * @returns {void}
 **/

function inlineParameterRefs({ name, value, template }) {
  /**
   * @param {any} node
   * @return {void}
   */
  function walk(node) {
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item)
      }
    }
    if (typeof node === 'object') {
      for (const [key, item] of Object.entries(node)) {
        if (item?.Ref === name) {
          node[key] = value
        } else {
          walk(item)
        }
      }
    }
  }
  walk(template)
}
