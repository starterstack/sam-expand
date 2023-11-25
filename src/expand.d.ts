export default function expand(): Promise<void>;
export type ExpandSchema = import('ajv').JSONSchemaType<{
    expand: {
        plugins?: string[];
        config?: Record<string, any>;
    };
}>;
export type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand';
export type Lifecycles = Array<Lifecycle>;
export type Log = import('./log.js').Log;
export type Plugin = (options: {
    template: any;
    templateDirectory: string;
    config: any;
    log: import('./log.js').Log;
    command: string;
    argv: string[];
    parse: typeof yamlParse;
    dump: (o: any) => string;
    spawn: import('./spawn.js').Spawn;
    configEnv: string;
    region?: string | undefined;
    baseDirectory?: string | undefined;
    lifecycle: Lifecycle;
}) => Promise<void>;
export type PluginSchema<T> = import('ajv').JSONSchemaType<T>;
import { yamlParse } from 'yaml-cfn';
import { dump } from 'js-yaml';
import spawn from './spawn.js';
