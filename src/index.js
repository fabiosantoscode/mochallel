'use strict'

require('babel-polyfill')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')
const semver = require('semver')
const Mocha = require('mocha')
const identity = x => x
const chalk = semver.satisfies(process.version, '>4') ? require('chalk') : { green: identity, gray: identity, red: identity }
const genericPool = require('./vendor/generic-pool')

const compressTime = time => {
  if (time < 2000) {
    return time + 'ms'
  }
  return Math.round(time / 1000) + 's'
}

const color = stdout => {
  return stdout
    .replace(/(✓)(.+)/g, (_, $0, $1) => chalk.green($0) + chalk.gray($1))
    .replace(/(\d+\).+)/g, (_, $0) => chalk.red($0))
    .replace(/(\(\d+ms\))/, (_, $0) => chalk.red($0))
}

module.exports = class MochaWrapper extends Mocha {
  constructor (options) {
    super(options)

    this.pool = genericPool.createPool({
      async create () {
        const cp = spawn('node', [path.join(__dirname, 'runner.js')], {
          stdio: ['pipe', 'pipe', 'ipc']
        })

        return new Promise(resolve => {
          cp.once('message', () => { resolve(cp) })
        })
      },
      destroy (cp) {
        cp.disconnect()
      }
    }, {
      max: options.maxParallel || os.cpus().length
    })

    this.files = []

    this.queue = []
    this.called = 0
  }

  addFile (file) {
    const files = fs.statSync(file).isDirectory() ? fs.readdirSync(file).map(f => path.join(file, f)) : [file]
    this.files.push(...files)
  }

  enqueueIndex (index, fn) {
    if (!this.queue[index]) this.queue[index] = []
    this.queue[index].push(fn)

    while (this.queue[this.called]) {
      this.queue[this.called].forEach(fn => fn())
      this.called++
    }
  }

  async run (cb) {
    let testsPassed = 0
    let failures = 0
    const timeStart = Date.now()
    await Promise.all(this.files.map((file, index) => {
      return this.pool.acquire().then(async cp => {
        cp.send({
          type: 'test',
          file: file,
          options: this.options
        })

        let stdout = ''
        cp.stdout.on('data', onData)

        function onData (data) {
          stdout += data
        }

        let firstInactivityInterval = true
        const inactivityInterval = setInterval(() => {
          if (firstInactivityInterval) {
            firstInactivityInterval = false
            process.stdout.write('\n')
          }
          console.log('still running...')
        }, 2 * 60 * 1000)

        const code = await new Promise(resolve => {
          cp.once('message', msg => {
            const { code } = JSON.parse(msg)

            resolve(code)
          })
        })

        clearInterval(inactivityInterval)

        if (code !== 0) {
          failures += code
        }

        cp.stdout.removeListener('data', onData)

        stdout = stdout.replace(/\n\n\n {2}(\d+) passing.+\n\n/, (_, $1) => {
          if (Number($1)) {
            testsPassed += Number($1)
          }
          return ''
        })

        stdout = color(stdout)

        this.enqueueIndex(index, () => {
          process.stdout.write(stdout)
        })
        this.pool.release(cp)
      })
    }))
    this.pool.drain().then(() => {
      this.pool.clear()
    })

    const time = chalk.gray(' ' + '(' + compressTime(Date.now() - timeStart) + ')')

    if (failures) {
      console.log(chalk.red('\n\n  ' + failures + ' failing') + time)
    } else {
      console.log(chalk.green('\n\n  ' + testsPassed + ' passing') + time)
    }

    cb(failures)
  }
}
