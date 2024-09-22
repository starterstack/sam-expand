declare module '@starterstack/sam-expand/parse' {
	export function template(templatePath: string): Promise<any>;

	export function samConfig(configPath: string): Promise<any>;
	export function parse(data: string, type: "toml" | "yaml"): any;
	/**
	 * Parse [SAM template](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html) yaml/json files, and [SAM config](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-config.html) yaml/toml files.
	 *
	 * Provides a parse method that parses yaml, json, or toml.
	 */
	export type Parse = (data: string, type: "toml" | "yaml") => any;

	export {};
}

declare module '@starterstack/sam-expand/log' {
	export default function log(format: string, ...args: any): void;
	export type Log = (format: string, ...args: any) => void;

	export {};
}

declare module '@starterstack/sam-expand/spawn' {
	export default function spawn(cmd: string, args: string[], options?: import("node:child_process").SpawnOptions): Promise<void | string>;
	/**
	 * [node:child_process](https://nodejs.org/docs/latest/api/child_process.html#child-process).spawn wrapper.
	 */
	export type Spawn = (cmd: string, args: string[], options?: import("node:child_process").SpawnOptions) => Promise<void | string>;

	export {};
}

declare module '@starterstack/sam-expand/resolve' {
	import type { yamlDump } from 'yaml-cfn';
	export function resolveFile(options: PluginOptions & {
		location: string;
		exportName: string;
		defaultValue?: string;
	}): Promise<string | undefined>;
	export type FileResolver = (options: PluginOptions) => Promise<Record<string, string | undefined | Promise<string | undefined>>>;
	type Lifecycle = "pre:package" | "post:package" | "pre:sync" | "post:sync" | "pre:build" | "post:build" | "pre:deploy" | "post:deploy" | "pre:delete" | "post:delete" | "pre:expand" | "expand" | "post:expand";
	type ArgvReader = ArgvReader_1;
	type PluginOptions = {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		argvReader: ArgvReader;
		parse: Parse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region?: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	};
	type Log = (format: string, ...args: any) => void;
	type ArgvReader_1 = (name: string, options?: {
		parameter: boolean;
	}) => string | undefined;
	/**
	 * Parse [SAM template](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html) yaml/json files, and [SAM config](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-config.html) yaml/toml files.
	 *
	 * Provides a parse method that parses yaml, json, or toml.
	 */
	type Parse = (data: string, type: "toml" | "yaml") => any;
	/**
	 * [node:child_process](https://nodejs.org/docs/latest/api/child_process.html#child-process).spawn wrapper.
	 */
	type Spawn = (cmd: string, args: string[], options?: import("node:child_process").SpawnOptions) => Promise<void | string>;

	export {};
}

declare module '@starterstack/sam-expand/plugins' {
	import type { yamlDump } from 'yaml-cfn';
	export type Plugin = Plugin_1;
	export type PluginOptions = PluginOptions_1;
	export type PluginSchema<T> = PluginSchema_1<T>;
	export type Lifecycles = Lifecycles_1;
	type Lifecycle = "pre:package" | "post:package" | "pre:sync" | "post:sync" | "pre:build" | "post:build" | "pre:deploy" | "post:deploy" | "pre:delete" | "post:delete" | "pre:expand" | "expand" | "post:expand";
	type Lifecycles_1 = Array<Lifecycle>;
	type ArgvReader = ArgvReader_1;
	type PluginOptions_1 = {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		argvReader: ArgvReader;
		parse: Parse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region?: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	};
	type Plugin_1 = (options: PluginOptions_1) => Promise<void>;
	type PluginSchema_1<T> = import("ajv").JSONSchemaType<T>;
	type Log = (format: string, ...args: any) => void;
	type ArgvReader_1 = (name: string, options?: {
		parameter: boolean;
	}) => string | undefined;
	/**
	 * Parse [SAM template](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html) yaml/json files, and [SAM config](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-config.html) yaml/toml files.
	 *
	 * Provides a parse method that parses yaml, json, or toml.
	 */
	type Parse = (data: string, type: "toml" | "yaml") => any;
	/**
	 * [node:child_process](https://nodejs.org/docs/latest/api/child_process.html#child-process).spawn wrapper.
	 */
	type Spawn = (cmd: string, args: string[], options?: import("node:child_process").SpawnOptions) => Promise<void | string>;

	export {};
}

declare module '@starterstack/sam-expand/plugins/parameter-overrides' {
	import type { yamlDump } from 'yaml-cfn';
	export const lifecycles: Lifecycles;


	export const schema: PluginSchema<Schema>;
	export const metadataConfig: "parameterOverrides";

	export const lifecycle: Plugin;
	export type Override = {
		name: string;
		exportName: string;
		defaultValue?: string;
	};
	export type Schema = Array<{
		location: string;
		overrides: Array<Override>;
	}>;
	type Plugin = Plugin_1;
	type PluginSchema<T> = PluginSchema_1<T>;
	type Lifecycles = Lifecycles_1;
	type Lifecycle = "pre:package" | "post:package" | "pre:sync" | "post:sync" | "pre:build" | "post:build" | "pre:deploy" | "post:deploy" | "pre:delete" | "post:delete" | "pre:expand" | "expand" | "post:expand";
	type Lifecycles_1 = Array<Lifecycle>;
	type ArgvReader = ArgvReader_1;
	type PluginOptions = {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		argvReader: ArgvReader;
		parse: Parse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region?: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	};
	type Plugin_1 = (options: PluginOptions) => Promise<void>;
	type PluginSchema_1<T> = import("ajv").JSONSchemaType<T>;
	type Log = (format: string, ...args: any) => void;
	type ArgvReader_1 = (name: string, options?: {
		parameter: boolean;
	}) => string | undefined;
	/**
	 * Parse [SAM template](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html) yaml/json files, and [SAM config](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-config.html) yaml/toml files.
	 *
	 * Provides a parse method that parses yaml, json, or toml.
	 */
	type Parse = (data: string, type: "toml" | "yaml") => any;
	/**
	 * [node:child_process](https://nodejs.org/docs/latest/api/child_process.html#child-process).spawn wrapper.
	 */
	type Spawn = (cmd: string, args: string[], options?: import("node:child_process").SpawnOptions) => Promise<void | string>;

	export {};
}

declare module '@starterstack/sam-expand/plugins/run-script-hooks' {
	import type { yamlDump } from 'yaml-cfn';
	export const metadataConfig: "script";

	export const lifecycles: Lifecycles;

	export const schema: HookSchema;

	export const lifecycle: Plugin;
	export type Hook = "pre:sync" | "post:sync" | "pre:build" | "post:build" | "pre:package" | "post:package" | "pre:deploy" | "post:deploy" | "pre:delete" | "post:delete";
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
		hooks: Record<keyof Hook, Array<Command> | undefined>;
	}>;
	type Plugin = Plugin_1;
	type PluginSchema<T> = PluginSchema_1<T>;
	type Lifecycles = Lifecycles_1;
	type Lifecycle = "pre:package" | "post:package" | "pre:sync" | "post:sync" | "pre:build" | "post:build" | "pre:deploy" | "post:deploy" | "pre:delete" | "post:delete" | "pre:expand" | "expand" | "post:expand";
	type Lifecycles_1 = Array<Lifecycle>;
	type ArgvReader = ArgvReader_1;
	type PluginOptions = {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		argvReader: ArgvReader;
		parse: Parse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region?: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	};
	type Plugin_1 = (options: PluginOptions) => Promise<void>;
	type PluginSchema_1<T> = import("ajv").JSONSchemaType<T>;
	type Log = (format: string, ...args: any) => void;
	type ArgvReader_1 = (name: string, options?: {
		parameter: boolean;
	}) => string | undefined;
	/**
	 * Parse [SAM template](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html) yaml/json files, and [SAM config](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-config.html) yaml/toml files.
	 *
	 * Provides a parse method that parses yaml, json, or toml.
	 */
	type Parse = (data: string, type: "toml" | "yaml") => any;
	/**
	 * [node:child_process](https://nodejs.org/docs/latest/api/child_process.html#child-process).spawn wrapper.
	 */
	type Spawn = (cmd: string, args: string[], options?: import("node:child_process").SpawnOptions) => Promise<void | string>;

	export {};
}

declare module '@starterstack/sam-expand/plugins/esbuild-node' {
	import type { yamlDump } from 'yaml-cfn';
	export const lifecycles: Lifecycles;

	export const schema: PluginSchema<{
		config: string;
	}>;
	export const metadataConfig: "esbuild";

	export const lifecycle: Plugin;
	type Plugin = Plugin_1;
	type PluginSchema<T> = PluginSchema_1<T>;
	type Lifecycles = Lifecycles_1;
	type Lifecycle = "pre:package" | "post:package" | "pre:sync" | "post:sync" | "pre:build" | "post:build" | "pre:deploy" | "post:deploy" | "pre:delete" | "post:delete" | "pre:expand" | "expand" | "post:expand";
	type Lifecycles_1 = Array<Lifecycle>;
	type ArgvReader = ArgvReader_1;
	type PluginOptions = {
		template: any;
		templateDirectory: string;
		config: any;
		log: Log;
		command: string;
		argv: string[];
		argvReader: ArgvReader;
		parse: Parse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region?: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	};
	type Plugin_1 = (options: PluginOptions) => Promise<void>;
	type PluginSchema_1<T> = import("ajv").JSONSchemaType<T>;
	type Log = (format: string, ...args: any) => void;
	type ArgvReader_1 = (name: string, options?: {
		parameter: boolean;
	}) => string | undefined;
	/**
	 * Parse [SAM template](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html) yaml/json files, and [SAM config](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-config.html) yaml/toml files.
	 *
	 * Provides a parse method that parses yaml, json, or toml.
	 */
	type Parse = (data: string, type: "toml" | "yaml") => any;
	/**
	 * [node:child_process](https://nodejs.org/docs/latest/api/child_process.html#child-process).spawn wrapper.
	 */
	type Spawn = (cmd: string, args: string[], options?: import("node:child_process").SpawnOptions) => Promise<void | string>;

	export {};
}

//# sourceMappingURL=index.d.ts.map