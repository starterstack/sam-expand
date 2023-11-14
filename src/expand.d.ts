export default function expand(): Promise<void>
export type Lifecycle =
  | 'pre:package'
  | 'post:package'
  | 'pre:build'
  | 'post:build'
  | 'pre:deploy'
  | 'post:deploy'
  | 'pre:delete'
  | 'post:delete'
  | 'expand'
export type Plugin = (options: {
  template: any
  command: string
  parse: typeof yamlParse
  dump: typeof yamlDump
  spawn: import('./spawn.js').Spawn
  lifecycle: Lifecycle
}) => Promise<void>
import { yamlParse } from 'yaml-cfn'
import { yamlDump } from 'yaml-cfn'
import spawn from './spawn.js'
