// @ts-check
import { parseArgs } from 'node:util'

/** @typedef {(name: string, options?: { parameter: boolean }) => string | undefined } ArgvReader */

/**
 * @param {string[]} args
 * @returns {ArgvReader}
 */

export default function create(args) {
  return function get(name, options) {
    if (options?.parameter) {
      const parameterIndex = args.findIndex((x) => x.startsWith(`${name}=`))
      return parameterIndex === -1
        ? undefined
        : sanitizeValue(args?.[parameterIndex]?.split('=')?.[1])
    } else {
      const { values } = parseArgs({
        options: {
          [name]: {
            type: 'string'
          }
        },
        allowPositionals: true,
        strict: false,
        args
      })
      const value = values[name]
      return value ? sanitizeValue(String(value)) : undefined
    }
  }
}

/**
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
function sanitizeValue(value) {
  return value?.replaceAll(/["']/g, '')
}
