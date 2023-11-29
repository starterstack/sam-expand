export default function spawn(cmd: string, args: string[], options?: import('node:child_process').SpawnOptions): Promise<void | string>;
export type Spawn = (cmd: string, args: string[], options?: import('node:child_process').SpawnOptions) => Promise<void | string>;
