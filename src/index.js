'use strict'

if (!global._babelPolyfill) require('babel-polyfill')
const fs = require('fs')
const path = require('path')
const Mocha = require('mocha')
const chalk = require('chalk')
const map = require('multiprocess-map')

const compressTime = time => {
  if (time < 1000) {
    return time + 'ms'
  }
  return Math.round(time / 1000) + 's'
}

const color = stdout => {
  return stdout
    .replace(/(✓)(.+)/g, (_, $0, $1) => chalk.green($0) + chalk.gray($1))
    .replace(/(\d+\).+)/g, (_, $0) => chalk.red($0))
    .replace(/(\(\d+m?s?\))/g, (_, $0) => chalk.red($0))
    .replace(/(\s+(Uncaught|Error)g .+)/, (_, $0) => chalk.red($0))
}

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
    const timeStart = Date.now()
    const testFiles = this.files.map(file => ({
      type: 'test',
      file: file,
      options: this.options
    }))
    let testsPassed = 0
    const processStdout = stdout => {
      stdout = stdout.replace(/\n{3} {2}(\d+) passing.+\n\n/, (_, $1) => {
        if (Number($1)) {
          testsPassed += Number($1)
        }
        return ''
      })

      return color(stdout)
    }

    const codes = await map(testFiles, ({ file, options }) => {
      const Mocha = require('mocha')
      const Promise = require('es6-promise')
      const mocha = new Mocha(options)

      mocha.addFile(file)

      return new Promise(resolve => {
        mocha.run(resolve)
      })
    }, { max: this.options.maxParallel, processStdout })

    const time = chalk.gray(' ' + '(' + compressTime(Date.now() - timeStart) + ')')

    const failures = codes.reduce((a, b) => a + b)
    if (failures) {
      console.log(chalk.red('\n\n  ' + failures + ' failing') + time)
    } else {
      console.log(chalk.green('\n\n  ' + testsPassed + ' passing') + time)
    }

    cb(failures)
  }
}
