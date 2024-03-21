// @ts-check

/**
 * @summary
 * Resolve mjs, mts, yaml, json, and toml files.
 *
 * @module
 **/

import assert from 'node:assert/strict'
import path from 'node:path'
import { readFile } from 'node:fs/promises'

/**
 * @typedef {(options: import('./expand.js').PluginOptions
 * ) => Promise<Record<string, string | undefined | Promise<string | undefined>>>} FileResolver
 **/

/**
 * @param {import('./expand.js').PluginOptions & {
 *   location: string
 *   exportName: string,
 *   defaultValue?: string
 * }} options
 * @returns {Promise<string | undefined>}
 **/
export async function resolveFile(options) {
  const { location, templateDirectory, parse, exportName, defaultValue } =
    options
  const fullPath =
    location?.startsWith('.') || !location?.startsWith('/')
      ? path.join(templateDirectory, location)
      : location
  const extname = path.extname(fullPath)

  if (!['.mts', '.mjs', '.json', '.yaml', '.yml', '.toml'].includes(extname)) {
    throw new Error(
      `unsupported file ${location} must be .mjs, .mts, .json, .yaml, .yml, or .toml`
    )
  }

  if (extname === '.mjs' || extname === '.mts') {
    const { default: module } = await import(fullPath)

    /** @type {FileResolver} */
    const resolverModule = module

    assert.equal(
      resolverModule?.constructor?.name,
      'AsyncFunction',
      `resolver: ${location} does not export default async function resolve({ command: string, lifecycle: Lifecycle, region?: string, configEnv: string) {}`
    )

    const { [exportName]: value } = await resolverModule(options)

    return (await value) ?? defaultValue
  } else {
    const type = extname === '.toml' ? 'toml' : 'yaml'
    const { [exportName]: value } = parse(
      await readFile(fullPath, 'utf8'),
      type
    )
    return value ?? defaultValue ?? undefined
  }
}
