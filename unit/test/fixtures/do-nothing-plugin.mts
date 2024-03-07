/* c8 ignore start */

import type { Plugin, Lifecycles } from '../../../src/expand.js'

export const lifecycle: Plugin = async function doNothing() {}

export const lifecycles: Lifecycles = [
  'expand',
  'pre:build',
  'post:build',
  'pre:package',
  'post:package',
  'pre:deploy',
  'post:deploy',
  'pre:delete',
  'post:delete'
]

// eslint-disable-next-line @typescript-eslint/require-await
export default async function getSettings() {
  return {
    get name() {
      return 'hello'
    }
  }
}

/* c8 ignore end */
