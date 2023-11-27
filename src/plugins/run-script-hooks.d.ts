export const metadataConfig: "script";
export const lifecycles: import('./types.js').Lifecycles;
export const schema: HookSchema;
export const lifecycle: import('./types.js').Plugin;
export type Hook = 'pre:build' | 'post:build' | 'pre:package' | 'post:package' | 'pre:deploy' | 'post:deploy' | 'pre:delete' | 'post:delete';
export type HookSchema = import('./types.js').PluginSchema<{
    hooks: {
        [keyof(Hook)]?: Array<{
            command: string;
            args: string[];
        }>;
    };
}>;
declare const hooks: Hook[];
export {};
