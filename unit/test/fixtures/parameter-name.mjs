export default async function resolver() {
  return {
    get name() {
      return 'test'
    }
  }
}
