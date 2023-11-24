// @ts-check
import { readFile, stat } from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'

/** @type {import('./types.js').PluginSchema<{ config: string }>} */
export const schema = {
  type: 'object',
  properties: {
    config: {
      type: 'string'
    }
  },
  required: ['config'],
  additionalProperties: false
}

export const metadataConfig = 'esbuild'

/** @type {import('../expand.js').Plugin} */
export const lifecycle = async function expand({
  template,
  parse,
  lifecycle,
  command,
  baseDirectory
}) {
  assert.ok(
    template?.Metadata?.expand?.config?.esbuild?.config,
    'Metadata.expand.config.esbuild.config missing'
  )

  if (command === 'build' && lifecycle === 'expand') {
    const esbuildConfig = parse(
      await readFile(template.Metadata.expand.config.esbuild.config, 'utf-8')
    )
    for (const [key, value] of Object.entries(template.Resources ?? {})) {
      if (value?.Type !== 'AWS::Serverless::Function') {
        continue
      }
      const properties = value?.Properties

      if (properties.Runtime && !properties.Runtime?.startsWith('nodejs')) {
        continue
      }

      if (
        !properties.Runtime &&
        !template.Globals?.Function?.Runtime?.startsWith('nodejs')
      ) {
        continue
      }

      const packageType = properties?.PackageType ?? 'Zip'
      if (packageType !== 'Zip') {
        continue
      }
      if (properties?.InlineCode) {
        continue
      }
      if (typeof properties?.CodeUri !== 'string') {
        continue
      }
      if (properties?.CodeUri?.startsWith('s3:')) {
        continue
      }
      assert.ok(
        !value?.Metadata?.BuildMethod,
        `lambda ${key} already has Metadata.BuildMethod specified`
      )
      assert.ok(
        !value?.Metadata?.BuildProperties,
        `lambda ${key} already has Metadata.BuildProperties specified`
      )
      const handler = properties?.Handler
      assert.ok(handler, `lambda ${key} missing handler`)
      const codeUri = value?.Properties?.CodeUri
      assert.ok(codeUri, `lambda ${key} missing codeUri`)
      value.Metadata ||= {}
      value.Metadata.BuildMethod = 'esbuild'
      value.Metadata.BuildProperties = {
        ...esbuildConfig,
        EntryPoints: [
          await findHandlerEntry({ codeUri, handler, baseDirectory })
        ]
      }
    }
  }
}

/**
 * @param {{ codeUri: string, baseDirectory?: string, handler: string }} options
 * @returns {Promise<string>}
 **/
async function findHandlerEntry({ codeUri, baseDirectory, handler }) {
  if (baseDirectory) {
    codeUri = path.join(baseDirectory, codeUri)
  }
  const filename = handler.split('.')[0]

  for (const extension of ['.js', '.mjs', '.ts', '.mts']) {
    const entry = filename + extension
    try {
      await stat(path.join(codeUri, entry))
      return entry
    } catch {}
  }
  throw new Error(`no entry point found for ${handler}`)
}
