import test from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { PassThrough } from 'node:stream'

test('windows arguments', async () => {
  /* c8 ignore start */
  const mockFn = test.mock.fn(() => {
    return {
      once(command, callback) {
        if (command === 'close') {
          callback()
        }
      },
      on() {},
      get exitCode() {
        return 0
      }
    }
  })
  /* c8 ignore end */
  const spawn = await esmock.p('../../src/spawn.js', {
    'node:os': {
      platform() {
        return 'win32'
      }
    },
    'node:child_process': {
      spawn(...args) {
        return mockFn(...args)
      }
    }
  })
  await spawn('ls', ['-lh'])
  assert.equal(mockFn.mock.callCount(), 1)
  assert.deepEqual(mockFn.mock.calls[0].arguments, [
    'cmd',
    ['/C', 'ls', '-lh'],
    {
      shell: true,
      stdio: 'inherit'
    }
  ])
})

test('non windows arguments', async () => {
  /* c8 ignore start */
  const mockFn = test.mock.fn(() => {
    return {
      once(command, callback) {
        if (command === 'close') {
          callback()
        }
      },
      on() {},
      get exitCode() {
        return 0
      }
    }
  })
  /* c8 ignore end */
  const spawn = await esmock.p('../../src/spawn.js', {
    'node:os': {
      platform() {
        return 'not win32'
      }
    },
    'node:child_process': {
      spawn(...args) {
        return mockFn(...args)
      }
    }
  })
  await spawn('ls', ['-lh'])
  assert.equal(mockFn.mock.callCount(), 1)
  assert.deepEqual(mockFn.mock.calls[0].arguments, [
    'ls',
    ['-lh'],
    {
      shell: true,
      stdio: 'inherit'
    }
  ])
})

test('command failed', async () => {
  /* c8 ignore start */
  const mockFn = test.mock.fn(() => {
    return {
      once(command, callback) {
        if (command === 'close') {
          callback()
        }
      },
      on() {},
      get exitCode() {
        return 1
      }
    }
  })
  /* c8 ignore end */
  const spawn = await esmock.p('../../src/spawn.js', {
    'node:os': {
      platform() {
        return 'non win32'
      }
    },
    'node:child_process': {
      spawn(...args) {
        return mockFn(...args)
      }
    }
  })
  await assert.rejects(spawn(), { message: 'command failed' })
})

test('default options', async () => {
  /* c8 ignore start */
  const mockFn = test.mock.fn(() => {
    return {
      once(command, callback) {
        if (command === 'close') {
          callback()
        }
      },
      on() {},
      get exitCode() {
        return 0
      }
    }
  })
  /* c8 ignore end */
  const spawn = await esmock.p('../../src/spawn.js', {
    'node:os': {
      platform() {
        return 'non win32'
      }
    },
    'node:child_process': {
      spawn(...args) {
        return mockFn(...args)
      }
    }
  })
  await spawn('ls', ['-lh'])
  assert.equal(mockFn.mock.callCount(), 1)
  assert.deepEqual(mockFn.mock.calls[0].arguments[2], {
    shell: true,
    stdio: 'inherit'
  })
})

test('non default options', async () => {
  /* c8 ignore start */
  const mockFn = test.mock.fn(() => {
    return {
      once(command, callback) {
        if (command === 'close') {
          callback()
        }
      },
      on() {},
      get exitCode() {
        return 0
      }
    }
  })
  /* c8 ignore end */
  const spawn = await esmock.p('../../src/spawn.js', {
    'node:os': {
      platform() {
        return 'non win32'
      }
    },
    'node:child_process': {
      spawn(...args) {
        return mockFn(...args)
      }
    }
  })
  await spawn('ls', ['-lh'], { stdio: 'pipe' })
  assert.equal(mockFn.mock.callCount(), 1)
  assert.deepEqual(mockFn.mock.calls[0].arguments[2], {
    stdio: 'pipe'
  })
})

test('stdout', async () => {
  const pass = new PassThrough()
  pass.write('a.out')
  /* c8 ignore start */
  const mockFn = test.mock.fn(() => {
    return {
      once(command, callback) {
        if (command === 'close') {
          callback()
          pass.end()
        }
      },
      stdout: pass,
      on() {},
      get exitCode() {
        return 0
      }
    }
  })
  /* c8 ignore end */
  const spawn = await esmock.p('../../src/spawn.js', {
    'node:os': {
      platform() {
        return 'non win32'
      }
    },
    'node:child_process': {
      spawn(...args) {
        return mockFn(...args)
      }
    }
  })
  const stdout = await spawn('ls', ['-lh'], { shell: true })
  assert.equal(stdout, 'a.out')
})

test('stderr', async () => {
  const stderr = new PassThrough()
  stderr.write('Something went wrong')
  /* c8 ignore start */
  const mockFn = test.mock.fn(() => {
    return {
      once(command, callback) {
        if (command === 'close') {
          callback()
          stderr.end()
        }
      },
      stderr,
      on() {},
      get exitCode() {
        return 1
      }
    }
  })
  /* c8 ignore end */
  const spawn = await esmock.p('../../src/spawn.js', {
    'node:os': {
      platform() {
        return 'non win32'
      }
    },
    'node:child_process': {
      spawn(...args) {
        return mockFn(...args)
      }
    }
  })
  await assert.rejects(spawn('ls', ['-lh'], { shell: true }), {
    message: 'Something went wrong'
  })
})

test('default error', async () => {
  /* c8 ignore start */
  const mockFn = test.mock.fn(() => {
    return {
      once(command, callback) {
        if (command === 'close') {
          callback()
          stderr.end()
        }
      },
      on() {},
      get exitCode() {
        return 1
      }
    }
  })
  /* c8 ignore end */
  const spawn = await esmock.p('../../src/spawn.js', {
    'node:os': {
      platform() {
        return 'non win32'
      }
    },
    'node:child_process': {
      spawn(...args) {
        return mockFn(...args)
      }
    }
  })
  await assert.rejects(spawn('ls', ['-lh'], { shell: true }), {
    message: 'command failed'
  })
})
