/**
 * @summary
 * Recursive object freezer.
 * @module
 **/

/**
 * @template T
 * @param {T} object
 * @returns {T}
 **/

export default function freezeNested(object) {
  const cloned = structuredClone(object)
  return freeze(cloned)
}

function freeze(cloned) {
  const propNames = Object.getOwnPropertyNames(cloned)

  for (const name of propNames) {
    const value = cloned[name]
    if (value && typeof value === 'object') {
      freeze(value)
    }
  }
  return Object.freeze(cloned)
}
