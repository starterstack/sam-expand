/**
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

/**
 * @template T
 * @param {T} object
 * @returns {T}
 **/

function freeze(cloned) {
  const propertyNames = Object.getOwnPropertyNames(cloned)

  for (const name of propertyNames) {
    const value = cloned[name]
    if (value && typeof value === 'object') {
      freeze(value)
    }
  }
  /** @type {T} */
  const frozen = Object.freeze(cloned)
  return frozen
}
