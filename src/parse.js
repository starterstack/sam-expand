//@ts-check

/**
 * @summary
 * Parse [SAM template](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html) yaml/json files, and [SAM config](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-config.html) yaml/toml files.
 *
 * @module
 **/

import { yamlParse } from 'yaml-cfn'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as tomlParse } from '@ltd/j-toml'
import freeze from './freeze.js'

/** @param { string } templatePath
 * @returns {Promise<any>}
 **/
export async function template(templatePath) {
  const templateData = await readFile(templatePath, 'utf8')
  return yamlParse(templateData)
}

/** @param { string } configPath
 * @returns {Promise<any>}
 **/

export async function samConfig(configPath) {
  const extname = path.extname(configPath)
  if (extname === '.toml') {
    return parse(await readFile(configPath, 'utf8'), 'toml')
  } else if (extname === '.yaml' || extname === '.yml') {
    return parse(await readFile(configPath, 'utf8'), 'yaml')
  } else {
    throw new TypeError(
      `unsupported samconfig ${configPath}, must be toml or yaml`
    )
  }
}

/** @param { string } data
/** @param { 'toml' | 'yaml' } type
 * @returns {any}
 **/

export function parse(data, type) {
  return type === 'toml' ? freeze(tomlParse(data)) : freeze(yamlParse(data))
}
