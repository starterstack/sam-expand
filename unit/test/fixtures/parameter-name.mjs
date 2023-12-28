export default async function resolver() {
  return {
    get name() {
      return 'test'
    },
    get asyncName() {
      return Promise.resolve('async name')
    }
  }
}
