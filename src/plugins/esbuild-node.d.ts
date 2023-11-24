export const schema: import('./types.js').PluginSchema<{
    config: string;
}>;
export const metadataConfig: "esbuild";
export const lifecycle: import('../expand.js').Plugin;
