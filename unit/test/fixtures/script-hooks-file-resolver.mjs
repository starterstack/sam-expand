// @ts-check

/** @type {import('../../../src/resolve.js').FileResolver} */
// eslint-disable-next-line @typescript-eslint/require-await
export default async function resolver({ lifecycle }) {
  return {
    get test() {
      return `file.${lifecycle}`
    }
  }
}
