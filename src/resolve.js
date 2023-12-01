// @ts-check

import assert from 'node:assert/strict'
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
 * @typedef {(options: {
 *   command: string,
 *   lifecycle: import('./expand.js').Lifecycle,
 *   configEnv: string,
 *   region?: string,
 * }) => Promise<Record<string, string | undefined>>} FileResolver
 **/

/**
 * @param {{
 *   location: string,
 *   templateDirectory: string,
 *   parse: import('yaml-cfn').yamlParse,
 *   exportName: string,
 *   defaultValue?: string,
 *   command: string,
 *   lifecycle: import('./expand.js').Lifecycle,
 *   configEnv: string,
 *   region?: string,
 * }} options
 * @returns {Promise<string | undefined>}
 **/

export async function resolveFile({
  location,
  templateDirectory,
  parse,
  exportName,
  defaultValue,
  command,
  lifecycle,
  configEnv,
  region
}) {
  const fullPath = location?.startsWith('.')
    ? path.join(templateDirectory, location)
    : location
  const extname = path.extname(fullPath)
  if (!['.mjs', '.json', '.yaml', '.yml'].includes(extname)) {
    throw new Error(
      `unsupported file ${location} must be .mjs, .json, .yaml, or .yml`
    )
  }

  if (extname === '.mjs') {
    const { default: module } = await import(fullPath)

    /** @type {FileResolver} */
    const resolverModule = module

    assert.equal(
      resolverModule?.constructor?.name,
      'AsyncFunction',
      `resolver: ${location} does not export default async function resolve({ command: string, lifecycle: Lifecycle, region?: string, configEnv: string) {}`
    )

    const { [exportName]: value } = await resolverModule({
      command,
      lifecycle,
      configEnv,
      region
    })

    return value ?? defaultValue
  } else {
    const { [exportName]: value } = parse(await readFile(fullPath, 'utf-8'))
    return value ?? defaultValue
  }
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
