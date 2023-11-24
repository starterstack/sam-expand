import { setTimeout } from 'timers/promises'
export default async function() {
  console.log('timeout')
  return 42
}
