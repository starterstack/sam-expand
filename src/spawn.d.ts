export default function spawn(cmd: string, args: string[]): Promise<void>;
export type Spawn = (cmd: string, args: string[]) => Promise<void>;
