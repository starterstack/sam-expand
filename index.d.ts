declare module '@starterstack/sam-expand/parse' {
	export function template(templatePath: string): Promise<any>;

	export function samConfig(configPath: string): Promise<any>;
}

declare module '@starterstack/sam-expand/resolve' {
	import type { yamlParse, yamlDump } from 'yaml-cfn';
	export function resolveFile(options: PluginOptions & {
		location: string;
		exportName: string;
		defaultValue?: string | undefined;
	}): Promise<string | undefined>;
	export type FileResolver = (options: PluginOptions) => Promise<Record<string, string | undefined>>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'pre:expand' | 'expand' | 'post:expand';
	type PluginOptions = {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		parse: typeof yamlParse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region?: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	};
	type Log = (format: string, ...args: any) => void;
	type Spawn = (cmd: string, args: string[], options?: import('node:child_process').SpawnOptions) => Promise<void | string>;
}

declare module '@starterstack/sam-expand/plugins' {
	import type { yamlParse, yamlDump } from 'yaml-cfn';
	export type Plugin = Plugin_1;
	export type Lifecycles = Lifecycles_1;
	export type PluginSchema<T> = PluginSchema_1<T>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'pre:expand' | 'expand' | 'post:expand';
	type Lifecycles_1 = Array<Lifecycle>;
	type PluginOptions = {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		parse: typeof yamlParse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region?: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	};
	type Plugin_1 = (options: PluginOptions) => Promise<void>;
	type PluginSchema_1<T> = import('ajv').JSONSchemaType<T>;
	type Log = (format: string, ...args: any) => void;
	type Spawn = (cmd: string, args: string[], options?: import('node:child_process').SpawnOptions) => Promise<void | string>;
}

declare module '@starterstack/sam-expand/plugins/parameter-overrides' {
	import type { yamlParse, yamlDump } from 'yaml-cfn';
	export const lifecycles: Lifecycles;


	export const schema: PluginSchema<Schema>;
	export const metadataConfig: "parameterOverrides";

	export const lifecycle: Plugin;
	export type File = {
		location: string;
		exportName: string;
		defaultValue?: string;
	};
	export type Schema = Array<{
		name: string;
		file?: File;
	}>;
	type Plugin = Plugin_1;
	type Lifecycles = Lifecycles_1;
	type PluginSchema<T> = PluginSchema_1<T>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'pre:expand' | 'expand' | 'post:expand';
	type Lifecycles_1 = Array<Lifecycle>;
	type PluginOptions = {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		parse: typeof yamlParse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region?: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	};
	type Plugin_1 = (options: PluginOptions) => Promise<void>;
	type PluginSchema_1<T> = import('ajv').JSONSchemaType<T>;
	type Log = (format: string, ...args: any) => void;
	type Spawn = (cmd: string, args: string[], options?: import('node:child_process').SpawnOptions) => Promise<void | string>;
}

declare module '@starterstack/sam-expand/plugins/run-script-hooks' {
	import type { yamlParse, yamlDump } from 'yaml-cfn';
	export const metadataConfig: "script";

	export const lifecycles: Lifecycles;

	export const schema: HookSchema;

	export const lifecycle: Plugin;
	export type Hook = 'pre:build' | 'post:build' | 'pre:package' | 'post:package' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete';
	export type File = {
		location: string;
		exportName: string;
		defaultValue?: string;
	};
	export type Command = {
		command: string;
		args: Array<{
			value?: string;
			file?: File;
		}>;
	};
	export type HookSchema = PluginSchema<{
		hooks: {
			[keyof(Hook)]?: Array<Command>;
		};
	}>;
	type Plugin = Plugin_1;
	type Lifecycles = Lifecycles_1;
	type PluginSchema<T> = PluginSchema_1<T>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'pre:expand' | 'expand' | 'post:expand';
	type Lifecycles_1 = Array<Lifecycle>;
	type PluginOptions = {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		parse: typeof yamlParse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region?: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	};
	type Plugin_1 = (options: PluginOptions) => Promise<void>;
	type PluginSchema_1<T> = import('ajv').JSONSchemaType<T>;
	type Log = (format: string, ...args: any) => void;
	type Spawn = (cmd: string, args: string[], options?: import('node:child_process').SpawnOptions) => Promise<void | string>;
}

declare module '@starterstack/sam-expand/plugins/esbuild-node' {
	import type { yamlParse, yamlDump } from 'yaml-cfn';
	export const lifecycles: Lifecycles;

	export const schema: PluginSchema<{
		config: string;
	}>;
	export const metadataConfig: "esbuild";

	export const lifecycle: Plugin;
	type Plugin = Plugin_1;
	type Lifecycles = Lifecycles_1;
	type PluginSchema<T> = PluginSchema_1<T>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'pre:expand' | 'expand' | 'post:expand';
	type Lifecycles_1 = Array<Lifecycle>;
	type PluginOptions = {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		parse: typeof yamlParse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region?: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	};
	type Plugin_1 = (options: PluginOptions) => Promise<void>;
	type PluginSchema_1<T> = import('ajv').JSONSchemaType<T>;
	type Log = (format: string, ...args: any) => void;
	type Spawn = (cmd: string, args: string[], options?: import('node:child_process').SpawnOptions) => Promise<void | string>;
}

//# sourceMappingURL=index.d.ts.map