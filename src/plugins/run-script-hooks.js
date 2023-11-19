// @ts-check

import assert from 'node:assert/strict'

/** @type {import('../expand.js').Plugin} */
export default async function runScriptHook({ template, spawn, lifecycle }) {
  assert.ok(
    template?.Metadata?.expand?.config?.script?.hooks,
    'Metadata.expand.config.script.hooks missing'
  )

  const hooks = template.Metadata.expand.config.script.hooks
  const commands = hooks[lifecycle]

  if (commands) {
    for (const command of commands) {
      for (const [cmd, args] of Object.entries(command)) {
        await spawn(cmd, args ?? [])
      }
    }
  }
}
