// eslint-disable-next-line @typescript-eslint/require-await
export default async function resolver() {
  return {
    get name() {
      return 'test'
    },
    get asyncName() {
      return Promise.resolve('async_name')
    },
    get asyncNoName() {
      return Promise.resolve()
    },
    get name1() {
      return 'value_for_name1'
    },
    get name2() {
      return 'value for name 2\nmultiline :)'
    },
    get name4() {
      return 'value for name 4\nmultiline :)'
    },
    get name3() {
      return 'value_for_name3'
    },
    get space() {
      return 'with space'
    }
  }
}
