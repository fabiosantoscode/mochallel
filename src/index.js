'use strict'

if (!global._babelPolyfill) require('babel-polyfill')
const fs = require('fs')
const events = require('events')
const path = require('path')
const Mocha = require('mocha')
const map = require('multiprocess-map')

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
    const runner = new events.EventEmitter()
    /* eslint-disable-line */ new this._reporter(runner)
    runner.emit('start')
    let previousTest = Date.now()
    let suite = ''
    const processStdout = stdout => {
      stdout.split(/\n/).forEach(line => {
        const duration = Date.now() - previousTest
        previousTest = Date.now()
        if (/^# pass/.test(line)) {
          const title = line.replace(/^# pass/, '').trim()
          runner.emit('pass', { title, slow: () => 100, duration })
        } else if (/^# fail/.test(line)) {
          const title = line.replace(/^# fail/, '').trim()
          runner.emit('fail', { title, fullTitle: () => title }, new Error(title))
        } else if (/^# suite/.test(line)) {
          const title = line.replace(/^# suite/, '').trim()
          if (suite) {
            runner.emit('suite end')
          }
          suite = title
          if (title) runner.emit('suite', { title })
        } else if (!/^#/.test(line)) {
          console.log(line)
        }
      })
    }

    const codes = await map(testFiles, ({ file, options }) => {
      const Mocha = require('mocha')
      const Promise = require('es6-promise')
      function Reporter (runner) {
        let prevSuite
        const onTest = test => {
          const suite = runner.suite
          const title = suite.title
          if (title !== prevSuite) {
            prevSuite = title
            console.log('# suite ' + title)
          }
        }
        runner.on('pass', test => {
          onTest(test)
          console.log('# pass ' + test.title.trim())
        })
        runner.on('fail', test => {
          onTest(test)
          console.log('# fail ' + test.title.trim())
        })
      }
      const mocha = new Mocha(Object.assign(options, { reporter: Reporter }))

      mocha.addFile(file)

      return new Promise(resolve => {
        mocha.run(resolve)
      })
    }, { max: this.options.maxParallel, processStdout })

    runner.emit('end')

    const failures = codes.reduce((a, b) => a + b)

    cb(failures)
  }
}
