'use strict'

if (!global._babelPolyfill) require('babel-polyfill')
const fs = require('fs')
const events = require('events')
const path = require('path')
const Mocha = require('mocha')
const map = require('multiprocess-map')
const TapParser = require('tap-parser')

module.exports = class MochaWrapper extends Mocha {
  constructor (options) {
    super(options)

    this.files = []
    this.queue = []
    this.called = 0
  }

  addFile (file) {
    const files = fs.statSync(file).isDirectory() ? fs.readdirSync(file).map(f => path.join(file, f)) : [file]
    this.files.push(...files)
  }

  enqueueIndex (index, fn) {
    this.queue[index] = fn

    while (this.queue[this.called]) {
      this.queue[this.called]()
      this.called++
    }
  }

  async run (cb) {
    const testFiles = this.files.map(file => ({
      type: 'test',
      file: file,
      options: this.options
    }))
    var p = new TapParser()
    const runner = new events.EventEmitter()
    /* eslint-disable-line */ new this._reporter(runner)
    runner.emit('start')
    let previousTest = Date.now()
    p.on('line', line => {
      const duration = Date.now() - previousTest
      previousTest = Date.now()
      if (/^(not )?ok/.test(line)) {
        const passed = /^ok/.test(line)
        const title = line.replace(/^(not )?ok/, '').trim()
        if (passed) {
          runner.emit('pass', { title, slow: () => 100, duration })
        } else {
          runner.emit('fail', { title })
        }
      }
    })
    const processStdout = stdout => {
      p.write(stdout)
    }

    const codes = await map(testFiles, ({ file, options }) => {
      const Mocha = require('mocha')
      const Promise = require('es6-promise')
      const mocha = new Mocha(options)

      mocha.reporter('tap')

      mocha.addFile(file)

      return new Promise(resolve => {
        mocha.run(resolve)
      })
    }, { max: this.options.maxParallel, processStdout })

    const failures = codes.reduce((a, b) => a + b)

    cb(failures)
  }
}
