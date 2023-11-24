declare module '@starterstack/sam-expand' {
	import type { yamlParse } from 'yaml-cfn';
	export default function expand(): Promise<void>;
	export type ExpandSchema = import('ajv').JSONSchemaType<{
		expand: {
			plugins?: string[];
			config?: Record<string, any>;
		};
	}>;
	export type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand';
	export type Log = Log_1;
	export type Plugin = (options: {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log_1;
		command: string;
		argv: string[];
		parse: typeof yamlParse;
		dump: (o: any) => string;
		spawn: Spawn;
		configEnv: string;
		region?: string | undefined;
		baseDirectory?: string | undefined;
		lifecycle: Lifecycle;
	}) => Promise<void>;
	export type PluginSchema<T> = import('ajv').JSONSchemaType<T>;
	type Log_1 = (format: string, ...args: any) => void;
	type Spawn = (cmd: string, args: string[]) => Promise<void>;
}

declare module '@starterstack/sam-expand/plugins' {
	import type { yamlParse } from 'yaml-cfn';
	export type Plugin = Plugin_1;
	export type PluginSchema<T> = PluginSchema_1<T>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand';
	type Plugin_1 = (options: {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		parse: typeof yamlParse;
		dump: (o: any) => string;
		spawn: Spawn;
		configEnv: string;
		region?: string | undefined;
		baseDirectory?: string | undefined;
		lifecycle: Lifecycle;
	}) => Promise<void>;
	type PluginSchema_1<T> = import('ajv').JSONSchemaType<T>;
	type Log = (format: string, ...args: any) => void;
	type Spawn = (cmd: string, args: string[]) => Promise<void>;
}

declare module '@starterstack/sam-expand/plugins/run-script-hooks' {
	import type { yamlParse } from 'yaml-cfn';
	export const metadataConfig: "script";
	export const schema: HookSchema;
	export const lifecycle: Plugin;
	export type Hook = 'pre:build' | 'post:build' | 'pre:package' | 'post:package' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete';
	export type HookSchema = PluginSchema<{
		hooks: {
			[keyof(Hook)]?: Array<{
				command: string;
				args: string[];
			}>;
		};
	}>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand';
	type Plugin = (options: {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		parse: typeof yamlParse;
		dump: (o: any) => string;
		spawn: Spawn;
		configEnv: string;
		region?: string | undefined;
		baseDirectory?: string | undefined;
		lifecycle: Lifecycle;
	}) => Promise<void>;
	type PluginSchema_1<T> = import('ajv').JSONSchemaType<T>;
	type PluginSchema<T> = PluginSchema_1<T>;
	type Log = (format: string, ...args: any) => void;
	type Spawn = (cmd: string, args: string[]) => Promise<void>;
}

declare module '@starterstack/sam-expand/plugins/esbuild-node' {
	import type { yamlParse } from 'yaml-cfn';
	export const schema: PluginSchema<{
		config: string;
	}>;
	export const metadataConfig: "esbuild";
	export const lifecycle: Plugin;
	type PluginSchema<T> = PluginSchema_1<T>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand';
	type Plugin = (options: {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		parse: typeof yamlParse;
		dump: (o: any) => string;
		spawn: Spawn;
		configEnv: string;
		region?: string | undefined;
		baseDirectory?: string | undefined;
		lifecycle: Lifecycle;
	}) => Promise<void>;
	type PluginSchema_1<T> = import('ajv').JSONSchemaType<T>;
	type Log = (format: string, ...args: any) => void;
	type Spawn = (cmd: string, args: string[]) => Promise<void>;
}

//# sourceMappingURL=index.d.ts.map