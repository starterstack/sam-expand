export default function runScriptHook(options: {
  template: any
  command: string
  parse: typeof import('yaml-cfn').yamlParse
  dump: typeof import('yaml-cfn').yamlDump
  spawn: import('../spawn.js').Spawn
  lifecycle: import('../expand.js').Lifecycle
}): Promise<void>
