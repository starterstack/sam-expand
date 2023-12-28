export default async function resolver() {
  return {
    get name() {
      return 'test'
    },
    get asyncName() {
      return Promise.resolve('async name')
    },
    get asyncNoName() {
      return Promise.resolve(undefined)
    }
  }
}
