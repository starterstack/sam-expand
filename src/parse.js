//@ts-check

import { yamlParse } from 'yaml-cfn'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as tomlParse } from '@ltd/j-toml'
import freeze from './freeze.js'

/** @param { string } templatePath
 * @returns {Promise<any>}
 **/
export async function template(templatePath) {
  const templateData = await readFile(templatePath, 'utf-8')
  return yamlParse(templateData)
}

/** @param { string } configPath
 * @returns {Promise<any>}
 **/

export async function samConfig(configPath) {
  const extname = path.extname(configPath)
  if (extname === '.toml') {
    return freeze(tomlParse(await readFile(configPath, 'utf-8')))
  } else if (extname === '.yaml' || extname === '.yml') {
    return freeze(yamlParse(await readFile(configPath, 'utf-8')))
  } else {
    throw new TypeError(
      `unsupported samconfig ${configPath}, must be toml or yaml`
    )
  }
}
