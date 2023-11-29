export default function spawn(cmd: string, args: string[]): Promise<string>;
export type Spawn = (cmd: string, args: string[]) => Promise<string>;
