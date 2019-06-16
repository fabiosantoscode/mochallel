'use strict'

const fs = require('fs')
const events = require('events')
const path = require('path')
const Mocha = require('mocha')
const map = require('multiprocess-map')

module.exports = class MochaWrapper extends Mocha {
  addFile (file) {
    const files = fs.statSync(file).isDirectory()
      ? fs.readdirSync(file)
        .map(f => path.join(file, f))
        .filter(f => fs.statSync(f).isFile())
      : [file]
    this.files.push(...files)
  }

  run (cb = () => null) {
    const testFiles = this.files.map(file => ({
      type: 'test',
      file: file,
      options: this.options
    }))
    if (!testFiles.length) {
      throw new Error('Mochallel called without test files')
    }
    const runner = new events.EventEmitter()
    /* eslint-disable-line */ new this._reporter(runner)
    runner.emit('start')
    let previousTest = Date.now()
    let currentSuite = ''
    const reportTag = '$_mochallelReport'
    const processStdout = stdout => {
      stdout.split(/\n/).forEach(line => {
        if (line.startsWith(reportTag)) {
          const duration = Date.now() - previousTest
          previousTest = Date.now()
          const { pass, fail, suite } = JSON.parse(line.slice(reportTag.length))
          if (pass) {
            runner.emit('pass', { title: pass.title, slow: () => 100, duration })
          } else if (fail) {
            const { title, message, stack } = fail

            const error = new Error(message)
            error.stack = stack

            runner.emit('fail', { title, fullTitle: () => title, titlePath: () => [title] }, error)
          } else if (suite) {
            const title = suite.title
            if (currentSuite) {
              runner.emit('suite end')
            }
            currentSuite = title
            if (title) runner.emit('suite', { title })
          }
        } else {
          console.log(line)
        }
      })
    }

    map(testFiles, ({ file, options }) => {
      const Mocha = require('mocha')
      function Reporter (runner) {
        let prevSuite
        const report = obj => {
          console.log('$_mochallelReport' + JSON.stringify(obj))
        }
        const onTest = () => {
          const suite = runner.suite.title
          if (suite !== prevSuite) {
            prevSuite = suite
            report({ suite })
          }
        }
        runner.on('pass', test => {
          onTest(test)
          report({ pass: { title: test.title } })
        })
        runner.on('fail', (test, err) => {
          onTest(test)
          report({ fail: { title: test.title, message: err.message, stack: err.stack } })
        })
      }
      const mocha = new Mocha(Object.assign(options, { reporter: Reporter }))

      mocha.addFile(file)

      return new Promise(resolve => {
        mocha.run(resolve)
      })
    }, { max: this.options.maxParallel, processStdout }).then(codes => {
      runner.emit('end')

      const failures = codes.reduce((a, b) => a + b)

      cb(failures)
    }).catch(error => {
      // Crash and burn, but report what we found
      console.error('UNEXPECTED MOCHALLEL ERROR:')
      console.error(error)
      process.exit(9)
    })
  }
}
