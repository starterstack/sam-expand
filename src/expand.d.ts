export default function expand(): Promise<void>;
export type ExpandSchema = import('ajv').JSONSchemaType<{
    expand: {
        plugins?: string[];
        config?: Record<string, any>;
    };
}>;
export type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand';
export type Plugin = (options: {
    template: any;
    command: string;
    argv: string[];
    parse: typeof yamlParse;
    dump: typeof yamlDump;
    spawn: import('./spawn.js').Spawn;
    configEnv: string;
    region?: string;
    baseDirectory?: string;
    lifecycle: Lifecycle;
}) => Promise<void>;
export type PluginSchema<T> = import('ajv').JSONSchemaType<T>;
import { yamlParse } from 'yaml-cfn';
import { yamlDump } from 'yaml-cfn';
import spawn from './spawn.js';
