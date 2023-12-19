// @ts-check

/**
 * @summary
 * Resolve mjs, yaml/json files.
 *
 * @module
 **/

import assert from 'node:assert/strict'
import path from 'node:path'
import { readFile } from 'node:fs/promises'

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
  const fullPath =
    location?.startsWith('.') || !location?.startsWith('/')
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
