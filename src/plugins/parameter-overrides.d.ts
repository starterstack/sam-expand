export const lifecycles: import('./types.js').Lifecycles;
export const schema: import('./types.js').PluginSchema<Array<{
    name: string;
    resolver: CloudFormation | File;
}>>;
export const metadataConfig: "parameter-overrides";
export const lifecycle: import('./types.js').Plugin;
export type CloudFormation = {
    region?: string;
    stack: string;
    exportName: string;
};
export type File = {
    location: string;
    exportName: string;
};
