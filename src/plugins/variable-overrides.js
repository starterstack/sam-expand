/// @xts-check
// import assert from 'node:assert/strict'
// import process from 'node:process'
// import path from 'path'

/**
 * @typedef {(options: {
 *   template: any,
 *   command: string
 *   parse: import('yaml-cfn').yamlParse,
 *   dump: import('yaml-cfn').yamlDump,
 *   spawn: import('../spawn.js').Spawn,
 *   lifecycle: import('../expand.js').Lifecycle
 * }) => Promise<any>} Override

/** @type {import('../expand.js').Plugin} */
export default async function expand({
  template,
  parse,
  dump,
  spawn,
  lifecycle,
  command
}) {
  return
  // assert.ok(
  //   template?.Metadata?.custom?.['variable-overrides'],
  //   'Metadata.custom.variable-overrides missing'
  // )
  // if (template.Metadata.custom['variable-overrides'].parameters) {
  //   assert.ok(
  //     Array.isArray(template?.Metadata?.custom?.['variable-overrides'].parameters),
  //     'Metadata.custom.variable-overrides.parameters must be an array'
  //   )
  //   if (command === 'build' && lifecycle === 'expand') {
  //     for (const override of template.Metadata.custom['variable-overrides'].parameters) {
  //       const entries = Object.entries(override)
  //       if (entries.length !== 1) {
  //         throw new Error(`can only include a single override property ${JSON.stringify(override)}`)
  //       }
  //       for (const [key, value] of entries) {
  //         if (!template?.Parameters?.[key]) {
  //           throw new Error(`parameter ${key} not found, but was declared in Metadata.custom.parameter-overrides`)
  //         }
  //         const pluginPath = value?.startsWith('.')
  //           ? path.join(process.env.INIT_CWD ?? process.cwd(), value)
  //           : value
  //         /** @type {{ default: Override }}*/
  //         const { default: overrideModule } = await import(pluginPath)
  //         if (!overrideModule) {
  //           throw new Error(`override ${key} ${value} must provide an esm default export`)
  //         }
  //         if (overrideModule?.constructor?.name !== 'AsyncFunction') {
  //           throw new Error(`override ${key} ${value} is not an async function`)
  //         }
  //         const value = await overrideModule({ template, parse, dump, spawn, lifecycle, command })
  //       }
  //     }
  //   }
  // }
  // if (template.Metadata.custom['variable-overrides'].stackName) {
  //   if (command === 'build' && lifecycle === 'expand') {
  //     const value = template.Metadata.custom['variable-overrides'].stackName
  //     const pluginPath = value?.startsWith('.')
  //       ? path.join(process.env.INIT_CWD ?? process.cwd(), value)
  //       : value
  //     /** @type {{ default: Override }}*/
  //     const { default: overrideModule } = await import(pluginPath)
  //     if (!overrideModule) {
  //       throw new Error(`override stackName must provide an esm default export`)
  //     }
  //     if (overrideModule?.constructor?.name !== 'AsyncFunction') {
  //       throw new Error(`override stackName is not an async function`)
  //     }
  //     template[variableOverrides].stackName = await overrideModule({ template, parse, dump, spawn, lifecycle, command })
  //   }
  // }
  // if (template.Metadata.custom['variable-overrides'].tags) {
  //   template[variableOverrides].tags ||= {}
  //   if (command === 'build' && lifecycle === 'expand') {
  //     const value = template.Metadata.custom['variable-overrides'].tags
  //     const pluginPath = value?.startsWith('.')
  //       ? path.join(process.env.INIT_CWD ?? process.cwd(), value)
  //       : value
  //     /** @type {{ default: Override }}*/
  //     const { default: overrideModule } = await import(pluginPath)
  //     if (!overrideModule) {
  //       throw new Error(`override stackName must provide an esm default export`)
  //     }
  //     if (overrideModule?.constructor?.name !== 'AsyncFunction') {
  //       throw new Error(`override stackName is not an async function`)
  //     }
  //     template[variableOverrides].tags = await overrideModule({ template, parse, dump, spawn, lifecycle, command })
  //   }
  // }
}
