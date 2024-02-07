// @ts-check

/**
 * @typedef {(format: string, ...args: any) => void} Log
 *
 * @remarks
 * Uses [node:util.formatWithOptions](https://nodejs.org/docs/latest/api/util.html#utilformatwithoptionsinspectoptions-format-args).
 * Use --debug flag to see verbose log output.
 *
 * @summary
 * Mimic same log output format as defined in [SAM cli](https://github.com/aws/aws-sam-cli).
 *
 * @example
 *
 * ```javascript
 * log('some message %O', { command, lifecycle })
 * ```
 * @module
 *
 **/

import { formatWithOptions } from 'node:util'

/**
 * @remarks
 * Uses [node:util.formatWithOptions](https://nodejs.org/docs/latest/api/util.html#utilformatwithoptionsinspectoptions-format-args).
 * Use --debug flag to see verbose log output.
 *
 * @summary
 * Mimic same log output format as defined in [SAM cli](https://github.com/aws/aws-sam-cli).
 *
 * @example
 *
 * ```javascript
 * log('some message %O', { command, lifecycle })
 * ```
 * @type {Log}
 **/
export default function log(format, ...arguments_) {
  const now = new Date()
  const pad2 = padLeft(2)
  const pad3 = padLeft(3)
  const year = now.getFullYear()
  const month = pad2(now.getMonth() + 1)
  const day = pad2(now.getDate())
  const hours = pad2(now.getHours())
  const minutes = pad2(now.getMinutes())
  const seconds = pad2(now.getSeconds())
  const milliseconds = pad3(now.getMilliseconds())

  const datePrefix = [
    `\u001B[1;36m${year}`,
    `\u001B[0m-\u001B[1;36m${month}`,
    `\u001B[0m-\u001B[1;36m${day}`
  ].join('')
  const timePrefix = [
    `\u001B[0m \u001B[1;92m${hours}`,
    `:${minutes}`,
    `:${seconds}`,
    `\u001B[0m,\u001B[1;36m${milliseconds}`
  ].join('')
  const message = `\u001B[0m | ${formatWithOptions(
    { colors: true },
    format,
    ...arguments_
  )}`
  console.log(`${datePrefix}${timePrefix}${message}`)
}

/**
 * @param {number} length
 * @returns {(x: number) => string}
 **/

function padLeft(length) {
  return function padLeftZeros(number) {
    return String(number).padStart(length, '0')
  }
}
