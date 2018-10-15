'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const { fork } = require('child_process')
const genericPool = require('generic-pool')
const Mocha = require('mocha')

module.exports = class MochaWrapper extends Mocha {
  constructor (options) {
    super(options)

    this.pool = genericPool.createPool({
      async create () {
        const cp = fork(path.join(__dirname, 'runner.js'), {
          stdio: ['ipc']
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
  }

  addFile (file) {
    const files = fs.statSync(file).isDirectory() ? fs.readdirSync(file).map(f => path.join(file, f)) : [file]
    this.files.push(...files)
  }

  async run (cb) {
    let testsPassed = 0
    let failures = 0
    await Promise.all(this.files.map(file => {
      return this.pool.acquire().then(async cp => {
        cp.send(JSON.stringify({
          type: 'test',
          file: file,
          options: this.options
        }))

        let stdout = ''
        cp.stdout.on('data', onData)

        function onData(data) {
          stdout += data
        }

        const code = await new Promise(resolve => {
          cp.once('message', msg => {
            const { code } = JSON.parse(msg)

            resolve(code)
          })
        })

        if (code !== 0) {
          failures += code
        }

        cp.stdout.removeListener('data', onData)

        stdout = stdout.replace(/\n\n  (\d+) passing.+\n\n/, (_, $1) => {
          if (Number($1)) {
            testsPassed += Number($1)
          }
          return ''
        })
        process.stdout.write(stdout)
        this.pool.release(cp)
      })
    }))
    this.pool.drain().then(() => {
      this.pool.clear()
    })

    if (failures) {
      console.log('  ' + failures + ' failed')
    } else {
      console.log('  ' + testsPassed + ' passed')
    }
  }
}
