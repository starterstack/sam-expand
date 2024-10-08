//@ts-check

/**
 * @typedef {(cmd: string, args: string[], options?: import('node:child_process').SpawnOptions) => Promise<void | string>} Spawn
 *
 * [node:child_process](https://nodejs.org/docs/latest/api/child_process.html#child-process).spawn wrapper.
 *
 * @example
 *
 * pipe output to current process stdout.
 *
 * ```javascript
 * await spawn('sam', '--help')
 * ```
 *
 * capture output
 *
 * ```javascript
 * const stdout = String(await spawn('git', ['rev-parse', 'HEAD'], { shell: true }))
 * ```
 * @module
 **/

import { spawn as nativeSpawn } from 'node:child_process'
import os from 'node:os'
import { once } from 'node:events'
import { Buffer } from 'node:buffer'

const windows = os.platform() === 'win32'

/**
 * [node:child_process](https://nodejs.org/docs/latest/api/child_process.html#child-process).spawn wrapper.
 *
 * @example
 *
 * pipe output to current process stdout.
 *
 * ```javascript
 * await spawn('sam', '--help')
 * ```
 *
 * capture output
 *
 * ```javascript
 * const stdout = String(await spawn('git', ['rev-parse', 'HEAD'], { shell: true }))
 * ```
 * @type {Spawn}
 **/
export default async function spawn(cmd, arguments_, options) {
  if (windows) {
    arguments_ = [
      '/C',
      cmd,
      ...arguments_.map((argument) => {
        return String(argument).replaceAll('^', '^^^^')
      })
    ]
    cmd = 'cmd'
  }

  options ||= {
    stdio: 'inherit',
    shell: true
  }

  const ps = nativeSpawn(cmd, arguments_, options)

  if (options.stdio) {
    await once(ps, 'close')
    if (ps.exitCode !== 0) {
      throw new Error('command failed')
    }
    return
  }

  const [stdout, stderr] = await Promise.all([
    concat(ps.stdout),
    concat(ps.stderr),
    once(ps, 'close')
  ])

  if (ps.exitCode === 0) {
    return stdout
  } else {
    throw new Error(stderr || 'command failed')
  }
}

/**
 * @param {import('node:stream').Readable | null} stream
 * @returns {Promise<string>}
 **/
async function concat(stream) {
  if (!stream) {
    return ''
  }
  /** @type {Buffer[]} */
  const data = []

  for await (const chunk of stream) {
    data.push(chunk)
  }
  return Buffer.concat(data).toString('utf8')
}
