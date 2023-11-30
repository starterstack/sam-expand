// @ts-check

import {
  CloudFormationClient,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation'

/** @type {import('./types.js').Lifecycles} */
export const lifecycles = ['pre:build', 'pre:deploy']

/**
 * @typedef {{ region?: string, stackName: string, exportName: string }} CloudFormation
 * @typedef {{ location: string, exportName: string }} File
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
              region: { type: 'string', nullable: true },
              stackName: { type: 'string' },
              exportName: { type: 'string' }
            },
            required: ['stackName', 'exportName'],
            additionalProperties: false,
            nullable: true
          },
          file: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              exportName: { type: 'string' }
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
export const lifecycle = async function expand({ template, region }) {
  /** @type {Schema} */
  const config = template.Metadata.expand.config?.['parameter-overrides']

  for (const parameter of config) {
    console.log(parameter.name)
    if (parameter.resolver.file) {
      console.log('file', parameter.resolver.file)
    } else if (parameter.resolver.cloudFormation) {
      const client = new CloudFormationClient({
        region:
          parameter.resolver.cloudFormation.region ?? region ?? 'us-east-1'
      })
      const result = await client.send(
        new DescribeStacksCommand({
          StackName: parameter.resolver.cloudFormation.stackName
        })
      )
      if (result?.Stacks?.[0] && result?.Stacks?.[0]?.Outputs) {
        const stack = result.Stacks[0]
        const outputs = stack.Outputs
        console.log(outputs)
        console.log(result)
        console.log('cloudformation', parameter.resolver.cloudFormation)
      }
    }
  }
}
