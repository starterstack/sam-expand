#!/usr/bin/env node

import os from 'node:os'
import expand from './expand.js'

const windows = os.platform() === 'win32'

if (windows && !/bash/.test(String(process.env.SHELL))) {
  console.error('\x1B[91monly git bash supported in windows!\x1B[0m')
  process.exit(1)
}

await expand()
