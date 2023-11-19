export default function expand(options: {
    template: any;
    command: string;
    argv: string[];
    parse: typeof import("yaml-cfn").yamlParse;
    dump: typeof import("yaml-cfn").yamlDump;
    spawn: import("../spawn.js").Spawn;
    configEnv: string;
    region: string;
    baseDirectory?: string | undefined;
    lifecycle: import("../expand.js").Lifecycle;
}): Promise<void>;
export type Override = (options: {
    template: any;
    command: string;
    parse: typeof import("yaml-cfn").yamlParse;
    dump: typeof import("yaml-cfn").yamlDump;
    spawn: import('../spawn.js').Spawn;
    lifecycle: import('../expand.js').Lifecycle;
}) => Promise<any>;
