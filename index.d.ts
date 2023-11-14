declare module '@starterstack/sam-expand/expand' {
  import type { yamlParse, yamlDump } from 'yaml-cfn'
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
    spawn: Spawn
    lifecycle: Lifecycle
  }) => Promise<void>
  type Spawn = (cmd: string, args: string[]) => Promise<void>
}

//# sourceMappingURL=index.d.ts.map
