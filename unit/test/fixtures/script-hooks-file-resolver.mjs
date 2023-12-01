// @ts-check

/** @type {import('../../../src/resolve.js').FileResolver} */
export default async function resolver({ lifecycle }) {
  return {
    get test() {
      return `file.${lifecycle}`
    }
  }
}
