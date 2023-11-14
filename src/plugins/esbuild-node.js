// @ts-check
import { readFile, stat } from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'

/** @type {import('../expand.js').Plugin} */
export default async function expand({ template, parse, lifecycle, command }) {
  assert.ok(
    template?.Metadata?.custom?.esbuild?.config,
    'Metadata.custom.esbuild.config missing'
  )
  if (command === 'esbuild' && lifecycle === 'expand') {
    const esbuildConfig = parse(
      await readFile(template.Metadata.custom.esbuild.config, 'utf-8')
    )
    for (const [key, value] of Object.entries(template.Resources ?? {})) {
      if (value?.Type !== 'AWS::Serverless::Function') {
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
      const handler = value?.Properties?.Handler
      assert.ok(handler, `lambda ${key} missing handler`)
      const codeUri = value?.Properties?.CodeUri
      assert.ok(codeUri, `lambda ${key} missing codeUri`)
      value.Metadata ||= {}
      value.Metadata.BuildMethod = 'esbuild'
      value.Metadata.BuildProperties = {
        ...esbuildConfig,
        EntryPoints: [await findHandlerEntry({ codeUri, handler })]
      }
    }
  }
}

async function findHandlerEntry({ codeUri, handler }) {
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

export const command = 'esbuild'
