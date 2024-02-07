import test from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import { PassThrough } from 'node:stream'

await test('windows arguments', async () => {
  /* c8 ignore start */
  const mockFunction = test.mock.fn(() => {
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
      spawn(...arguments_) {
        return mockFunction(...arguments_)
      }
    }
  })
  await spawn('ls', ['-lh'])
  assert.equal(mockFunction.mock.callCount(), 1)
  assert.deepEqual(mockFunction.mock.calls[0].arguments, [
    'cmd',
    ['/C', 'ls', '-lh'],
    {
      shell: true,
      stdio: 'inherit'
    }
  ])
})

await test('non windows arguments', async () => {
  /* c8 ignore start */
  const mockFunction = test.mock.fn(() => {
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
      spawn(...arguments_) {
        return mockFunction(...arguments_)
      }
    }
  })
  await spawn('ls', ['-lh'])
  assert.equal(mockFunction.mock.callCount(), 1)
  assert.deepEqual(mockFunction.mock.calls[0].arguments, [
    'ls',
    ['-lh'],
    {
      shell: true,
      stdio: 'inherit'
    }
  ])
})

await test('command failed', async () => {
  /* c8 ignore start */
  const mockFunction = test.mock.fn(() => {
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
      spawn(...arguments_) {
        return mockFunction(...arguments_)
      }
    }
  })
  await assert.rejects(spawn(), { message: 'command failed' })
})

await test('default options', async () => {
  /* c8 ignore start */
  const mockFunction = test.mock.fn(() => {
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
      spawn(...arguments_) {
        return mockFunction(...arguments_)
      }
    }
  })
  await spawn('ls', ['-lh'])
  assert.equal(mockFunction.mock.callCount(), 1)
  assert.deepEqual(mockFunction.mock.calls[0].arguments[2], {
    shell: true,
    stdio: 'inherit'
  })
})

await test('non default options', async () => {
  /* c8 ignore start */
  const mockFunction = test.mock.fn(() => {
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
      spawn(...arguments_) {
        return mockFunction(...arguments_)
      }
    }
  })
  await spawn('ls', ['-lh'], { stdio: 'pipe' })
  assert.equal(mockFunction.mock.callCount(), 1)
  assert.deepEqual(mockFunction.mock.calls[0].arguments[2], {
    stdio: 'pipe'
  })
})

await test('stdout', async () => {
  const pass = new PassThrough()
  pass.write('a.out')
  /* c8 ignore start */
  const mockFunction = test.mock.fn(() => {
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
      spawn(...arguments_) {
        return mockFunction(...arguments_)
      }
    }
  })
  const stdout = await spawn('ls', ['-lh'], { shell: true })
  assert.equal(stdout, 'a.out')
})

await test('stderr', async () => {
  const stderr = new PassThrough()
  stderr.write('Something went wrong')
  /* c8 ignore start */
  const mockFunction = test.mock.fn(() => {
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
      spawn(...arguments_) {
        return mockFunction(...arguments_)
      }
    }
  })
  await assert.rejects(spawn('ls', ['-lh'], { shell: true }), {
    message: 'Something went wrong'
  })
})

await test('default error', async () => {
  /* c8 ignore start */
  const mockFunction = test.mock.fn(() => {
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
      spawn(...arguments_) {
        return mockFunction(...arguments_)
      }
    }
  })
  await assert.rejects(spawn('ls', ['-lh'], { shell: true }), {
    message: 'command failed'
  })
})
