import { test } from 'node:test'
import assert from 'node:assert/strict'
import readArgv from '../../src/read-argv.js'

test('read argv', async (t) => {
  await t.test('default args', () => {
    process.argv = [null, null, '--name', "'Jack'"]
    assert.equal(readArgv()('name'), 'Jack')
    process.argv = [null, null, '--name', "'Jill'"]
    assert.equal(readArgv(['--name', 'Jack'])('name'), 'Jack')
  })
  await t.test('missing', () => {
    assert.equal(readArgv([])('name'), undefined)
    assert.equal(readArgv([])('name', { parameter: true }), undefined)
    assert.equal(
      readArgv(['--parameter-overrides', "Stage='dev'"])('Stack', {
        parameter: true
      }),
      undefined
    )
  })
  await t.test('parameter', () => {
    const read = readArgv([
      '--parameter-overrides',
      "Stack='stacky'",
      "Stage='dev'"
    ])
    assert.equal(read('Stack', { parameter: true }), 'stacky')
    assert.equal(read('Stack'), undefined)
    assert.equal(read('Stage', { parameter: true }), 'dev')
    assert.equal(read('Stage', { parameter: false }), undefined)
  })
  await t.test('sanitize', () => {
    const read = readArgv([
      '--region',
      "'eu-west-1'",
      '--name',
      'Jack',
      '--parameter-overrides',
      "Stack='stacky'",
      "Stage='dev'"
    ])
    assert.equal(read('Stack', { parameter: true }), 'stacky')
    assert.equal(read('name'), 'Jack')
    assert.equal(read('region'), 'eu-west-1')
    assert.equal(read('Stage', { parameter: true }), 'dev')
  })
})
