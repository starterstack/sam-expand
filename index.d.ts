declare module '@starterstack/sam-expand' {
	import type { yamlParse, yamlDump } from 'yaml-cfn';
	export default function expand(): Promise<void>;
	export type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand';
	export type Plugin = (options: {
		template: any;
		command: string;
		argv: string[];
		parse: typeof yamlParse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	}) => Promise<void>;
	type Spawn = (cmd: string, args: string[]) => Promise<void>;
}

declare module '@starterstack/sam-expand/plugins' {
	import type { yamlParse, yamlDump } from 'yaml-cfn';
	export type Plugin = Plugin_1;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand';
	type Plugin_1 = (options: {
		template: any;
		command: string;
		argv: string[];
		parse: typeof yamlParse;
		dump: typeof yamlDump;
		spawn: Spawn;
		configEnv: string;
		region: string;
		baseDirectory?: string;
		lifecycle: Lifecycle;
	}) => Promise<void>;
	type Spawn = (cmd: string, args: string[]) => Promise<void>;
}

declare module '@starterstack/sam-expand/plugins/run-script-hooks' {
	export default function runScriptHook(options: {
		template: any;
		command: string;
		argv: string[];
		parse: typeof import("yaml-cfn").yamlParse;
		dump: typeof import("yaml-cfn").yamlDump;
		spawn: Spawn;
		configEnv: string;
		region: string;
		baseDirectory?: string | undefined;
		lifecycle: Lifecycle;
	}): Promise<void>;
	type Spawn = (cmd: string, args: string[]) => Promise<void>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand';
}

declare module '@starterstack/sam-expand/plugins/esbuild-node' {
	export default function expand(options: {
		template: any;
		command: string;
		argv: string[];
		parse: typeof import("yaml-cfn").yamlParse;
		dump: typeof import("yaml-cfn").yamlDump;
		spawn: Spawn;
		configEnv: string;
		region: string;
		baseDirectory?: string | undefined;
		lifecycle: Lifecycle;
	}): Promise<void>;
	type Spawn = (cmd: string, args: string[]) => Promise<void>;
	type Lifecycle = 'pre:package' | 'post:package' | 'pre:build' | 'post:build' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete' | 'expand';
}

//# sourceMappingURL=index.d.ts.map