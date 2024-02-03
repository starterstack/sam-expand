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
    },
    get name1() {
      return 'value for name1'
    },
    get name2() {
      return 'value for name 2\nmultiline :)'
    },
    get name4() {
      return 'value for name 4\nmultiline :)'
    },
    get name3() {
      return 'value for name3'
    }
  }
}
