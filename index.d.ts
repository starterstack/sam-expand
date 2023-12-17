declare module '@starterstack/sam-expand/parse' {
	export function template(templatePath: string): Promise<any>;

	export function samConfig(configPath: string): Promise<any>;
}

declare module '@starterstack/sam-expand/resolve' {
	export function resolveFile({ location, templateDirectory, parse, exportName, defaultValue, command, lifecycle, configEnv, region }: {
		location: string;
		templateDirectory: string;
		parse: typeof import("yaml-cfn").yamlParse;
		exportName: string;
		defaultValue?: string;
		command: string;
		lifecycle: Lifecycle;
		configEnv: string;
		region?: string;
	}): Promise<string | undefined>;
	export type FileResolver = (options: {
		command: string;
		lifecycle: Lifecycle;
		configEnv: string;
		region?: string;
	}) => Promise<Record<string, string | undefined>>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'pre:expand' | 'expand' | 'post:expand';
}

declare module '@starterstack/sam-expand/plugins' {
	import type { yamlParse } from 'yaml-cfn';
	export type Plugin = Plugin_1;
	export type Lifecycles = Lifecycles_1;
	export type PluginSchema<T> = PluginSchema_1<T>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'pre:expand' | 'expand' | 'post:expand';
	type Lifecycles_1 = Array<Lifecycle>;
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
	type Spawn = (cmd: string, args: string[], options?: import('node:child_process').SpawnOptions) => Promise<void | string>;
}

declare module '@starterstack/sam-expand/plugins/parameter-overrides' {
	import type { yamlParse } from 'yaml-cfn';
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
	type Spawn = (cmd: string, args: string[], options?: import('node:child_process').SpawnOptions) => Promise<void | string>;
}

declare module '@starterstack/sam-expand/plugins/run-script-hooks' {
	import type { yamlParse } from 'yaml-cfn';
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
	type Spawn = (cmd: string, args: string[], options?: import('node:child_process').SpawnOptions) => Promise<void | string>;
}

declare module '@starterstack/sam-expand/plugins/esbuild-node' {
	import type { yamlParse } from 'yaml-cfn';
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
	type Spawn = (cmd: string, args: string[], options?: import('node:child_process').SpawnOptions) => Promise<void | string>;
}

//# sourceMappingURL=index.d.ts.map