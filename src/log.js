// @ts-check

import { formatWithOptions } from 'node:util'

/** @typedef {(format: string, ...args: any) => void} Log */

/**
 * @type {Log}
 **/

export default function log(format, ...args) {
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
    `\x1B[1;36m${year}`,
    `\x1B[0m-\x1B[1;36m${month}`,
    `\x1B[0m-\x1B[1;36m${day}`
  ].join('')
  const timePrefix = [
    `\x1B[0m \x1B[1;92m${hours}`,
    `:${minutes}`,
    `:${seconds}`,
    `\x1B[0m,\x1B[1;36m${milliseconds}`
  ].join('')
  const message = `\x1B[0m | ${formatWithOptions(
    { colors: true },
    format,
    ...args
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
