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
  templateDirectory,
  parse,
  log,
  lifecycle,
  command,
  baseDirectory
}) {
  assert.ok(
    template?.Metadata?.expand?.config?.esbuild?.config,
    'Metadata.expand.config.esbuild.config missing'
  )

  if (command === 'build' && lifecycle === 'expand') {
    log('esbuild lifecycle %O', { command, lifecycle })
    const esbuildConfigPath = resolvePath(
      templateDirectory,
      template.Metadata.expand.config.esbuild.config
    )

    log('esbuild config %O', esbuildConfigPath)
    const esbuildConfig = parse(await readFile(esbuildConfigPath, 'utf-8'))
    for (const [key, value] of Object.entries(template.Resources ?? {})) {
      if (value?.Type !== 'AWS::Serverless::Function') {
        continue
      }
      const properties = value?.Properties

      if (properties.Runtime && !properties.Runtime?.startsWith('nodejs')) {
        log('Skipping esbuild, no runtime detected %O', { lambda: key })
        continue
      }

      if (
        !properties.Runtime &&
        !template.Globals?.Function?.Runtime?.startsWith('nodejs')
      ) {
        log('Skipping esbuild, runtime not nodejs %O', { lambda: key })
        continue
      }

      const packageType = properties?.PackageType ?? 'Zip'
      if (packageType !== 'Zip') {
        log('Skipping esbuild, package type not Zip %O', { lambda: key })
        continue
      }
      if (properties?.InlineCode) {
        log('Skipping esbuild, inline code set %O', { lambda: key })
        continue
      }
      if (typeof properties?.CodeUri !== 'string') {
        log('Skipping esbuild, code uri not local path %O', { lambda: key })
        continue
      }
      if (properties?.CodeUri?.startsWith('s3:')) {
        log('Skipping esbuild, code uri s3 %O', { lambda: key })
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
      const lambdaEntrypoint = await findHandlerEntry({
        codeUri,
        handler,
        baseDirectory: baseDirectory
          ? resolvePath(templateDirectory, baseDirectory)
          : templateDirectory
      })
      log('lambda entrypoint %O', { lambda: key, entry: lambdaEntrypoint })
      value.Metadata.BuildProperties = {
        ...esbuildConfig,
        EntryPoints: [lambdaEntrypoint]
      }
    }
  } else {
    log('skipping esbuild lifecycle %O', { command, lifecycle })
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

/**
 * @param {string} baseDirectory
 * @param {string} filePath
 * @returns string
 **/

function resolvePath(baseDirectory, filePath) {
  if (filePath?.startsWith('.')) {
    return path.join(baseDirectory, filePath)
  } else {
    return filePath
  }
}
