// @ts-check

import path from 'node:path'
import { readFile } from 'node:fs/promises'
import {
  CloudFormationClient,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation'

/** @type {Map<string, CloudFormationClient>} */
const clients = new Map()

/** @type {Map<string, import('@aws-sdk/client-cloudformation').DescribeStacksOutput>} */
const cloudformationResults = new Map()

/**
 * @param {{ location: string, parse: import('yaml-cfn').yamlParse, exportName: string, defaultValue?: string }} options
 * @returns {Promise<string | undefined>}
 **/
export async function resolveFile({
  location,
  parse,
  exportName,
  defaultValue
}) {
  const extname = path.extname(location)
  if (!['.mjs', '.json', '.yaml', '.yml']) {
    throw new Error(
      `unsupported file ${location} must be .mjs, .json, .yaml, or .yml`
    )
  }
  const { [exportName]: value } =
    extname === '.mjs'
      ? await import(location)
      : parse(await readFile(location, 'utf-8'))
  return value ?? defaultValue
}

/**
 * @param {{ stackRegion: string, outputKey: string, stackName: string, defaultValue?: string }} options
 * @returns {Promise<string | undefined>}
 **/

export async function resolveCloudFormationOutput({
  stackRegion,
  outputKey,
  stackName,
  defaultValue
}) {
  let result = cloudformationResults.get(`${stackRegion}.${stackName}`)
  if (!result) {
    let client = clients.get(stackRegion)
    if (!client) {
      client = new CloudFormationClient({ region: stackRegion })
      clients.set(stackRegion, client)
    }
    result = await client.send(
      new DescribeStacksCommand({
        StackName: stackName
      })
    )
    cloudformationResults.set(`${stackRegion}.${stackName}`, result)
  }
  for (const output of result?.Stacks?.[0]?.Outputs ?? []) {
    if (output.OutputKey === outputKey) {
      return output.OutputValue ?? defaultValue
    }
  }
  return defaultValue
}
