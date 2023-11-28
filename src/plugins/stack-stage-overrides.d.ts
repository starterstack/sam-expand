export const lifecycles: import('./types.js').Lifecycles;
export const schema: import('./types.js').PluginSchema<{
    region?: string;
    'suffix-stage': boolean;
    'config-env'?: string;
    stage?: string;
}>;
export const metadataConfig: "stack-stage-overrides";
export const lifecycle: import('./types.js').Plugin;
