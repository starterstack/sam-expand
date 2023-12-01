// @ts-check

import path from 'node:path'
import { resolveFile, resolveCloudFormationOutput } from '../resolve.js'

/** @type {import('./types.js').Lifecycles} */
export const lifecycles = ['pre:deploy']

/**
 * @typedef {{ stackRegion?: string, stackName: string, outputKey: string, defaultValue?: string }} CloudFormation
 * @typedef {{ location: string, exportName: string, defaultValue?: string }} File
 * @typedef {Array<{ name: string, resolver: { file?: File, cloudFormation?: CloudFormation } }>} Schema
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
      resolver: {
        type: 'object',
        properties: {
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
        },
        additionalProperties: false
      },
      additionalProperties: false
    },
    required: ['name', 'resolver'],
    additionalProperties: false
  }
}

export const metadataConfig = 'parameter-overrides'

/** @type {import('./types.js').Plugin} */
export const lifecycle = async function expand({
  template,
  parse,
  templateDirectory,
  region,
  argv
}) {
  /** @type {Schema} */
  const config = template.Metadata.expand.config?.['parameter-overrides']

  for (const parameter of config) {
    if (!template.Parameters?.[parameter.name]) {
      throw new Error(`parameter ${parameter.name} not found in template`)
    }
    if (parameter.resolver.file) {
      const resolveLocation = path.join(
        templateDirectory,
        parameter.resolver.file.location
      )
      const { exportName, defaultValue } = parameter.resolver.file
      const value = await resolveFile({
        location: resolveLocation,
        exportName,
        defaultValue,
        parse
      })
      if (!value) {
        throw new Error(
          `parameter ${parameter.name} resolver ${parameter.resolver.file.location} missing ${exportName}`
        )
      }
      addParameter({ argv, name: parameter.name, value })
    } else if (parameter.resolver.cloudFormation) {
      const { stackName, defaultValue, stackRegion, outputKey } =
        parameter.resolver.cloudFormation

      if (!region && !stackRegion) {
        throw new Error(
          `${stackName}.${outputKey} can't be resolved, missing region`
        )
      }
      const value = await resolveCloudFormationOutput({
        stackRegion: String(stackRegion ?? region),
        stackName,
        defaultValue,
        outputKey
      })
      if (!value) {
        throw new Error(
          `parameter ${parameter.name} stack ${stackName} missing output ${outputKey}`
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
