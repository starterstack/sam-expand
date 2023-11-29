/**
 * @template T
 * @param {T} object
 * @returns {T}
 **/

export default function freeze(object) {
  const cloned = structuredClone(object)
  const propNames = Object.getOwnPropertyNames(cloned)

  for (const name of propNames) {
    const value = cloned[name]
    if (value && typeof value === 'object') {
      freeze(value)
    }
  }
  return Object.freeze(cloned)
}
