//@ts-check

import { spawn as nativeSpawn } from 'node:child_process'
import os from 'node:os'

const windows = os.platform() === 'win32'

/**
 * @typedef {(cmd: string, args: string[]) => Promise<void>} Spawn
 **/

/** @type {Spawn} */
export default async function spawn(cmd, args) {
  if (windows) {
    args = ['/C', cmd].concat(args).map((arg) => {
      if (typeof arg === 'string') {
        return arg.replace(/\^/g, '^^^^')
      } else {
        return arg
      }
    })
    cmd = 'cmd'
  }

  /** @type {import('node:child_process').SpawnOptions} */
  const options = {
    stdio: 'inherit',
    shell: true
  }
  const ps = nativeSpawn(cmd, args, options)
  await new Promise((resolve, reject) => {
    ps.once('close', (code) => {
      if (code === 0) {
        resolve(undefined)
      } else {
        reject(new Error('command failed'))
      }
    })
  })
}
