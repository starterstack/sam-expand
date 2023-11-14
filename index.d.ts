declare module '@starterstack/sam-expand/plugins' {
  import type { yamlParse, yamlDump } from 'yaml-cfn'
  export type Plugin = Plugin_1
  type Lifecycle =
    | 'pre:package'
    | 'post:package'
    | 'pre:build'
    | 'post:build'
    | 'pre:deploy'
    | 'post:deploy'
    | 'pre:delete'
    | 'post:delete'
    | 'expand'
  type Plugin_1 = (options: {
    template: any
    command: string
    parse: typeof yamlParse
    dump: typeof yamlDump
    spawn: Spawn
    lifecycle: Lifecycle
  }) => Promise<void>
  type Spawn = (cmd: string, args: string[]) => Promise<void>
}

declare module '@starterstack/sam-expand/plugins/run-script-hooks' {
  export default function runScriptHook(options: {
    template: any
    command: string
    parse: typeof import('yaml-cfn').yamlParse
    dump: typeof import('yaml-cfn').yamlDump
    spawn: Spawn
    lifecycle: Lifecycle
  }): Promise<void>
  type Spawn = (cmd: string, args: string[]) => Promise<void>
  type Lifecycle =
    | 'pre:package'
    | 'post:package'
    | 'pre:build'
    | 'post:build'
    | 'pre:deploy'
    | 'post:deploy'
    | 'pre:delete'
    | 'post:delete'
    | 'expand'
}

declare module '@starterstack/sam-expand/plugins/esbuild-node' {
  export default function expand(options: {
    template: any
    command: string
    parse: typeof import('yaml-cfn').yamlParse
    dump: typeof import('yaml-cfn').yamlDump
    spawn: Spawn
    lifecycle: Lifecycle
  }): Promise<void>
  export const command: 'esbuild'
  type Spawn = (cmd: string, args: string[]) => Promise<void>
  type Lifecycle =
    | 'pre:package'
    | 'post:package'
    | 'pre:build'
    | 'post:build'
    | 'pre:deploy'
    | 'post:deploy'
    | 'pre:delete'
    | 'post:delete'
    | 'expand'
}

//# sourceMappingURL=index.d.ts.map
