/** @type {import('./types.js').Lifecycles} */
export const lifecycles: import('./types.js').Lifecycles;
/**
 * @typedef {{ region?: string, stackName: string, exportName: string }} CloudFormation
 * @typedef {{ location: string, exportName: string }} File
 * @typedef {Array<{ name: string, resolver: { file?: File, cloudFormation?: CloudFormation } }>} Schema
 **/
/**
 * @type {import('./types.js').PluginSchema<Schema>}
 */
export const schema: import('./types.js').PluginSchema<Schema>;
export const metadataConfig: "parameter-overrides";
/** @type {import('./types.js').Plugin} */
export const lifecycle: import('./types.js').Plugin;
export type CloudFormation = {
    region?: string;
    stackName: string;
    exportName: string;
};
export type File = {
    location: string;
    exportName: string;
};
export type Schema = Array<{
    name: string;
    resolver: {
        file?: File;
        cloudFormation?: CloudFormation;
    };
}>;
