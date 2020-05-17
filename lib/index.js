'use strict'

const fs = require('fs')
const events = require('events')
const { Worker } = require('worker_threads')
const path = require('path')
const Mocha = require('mocha')
const createStatsCollector = require('mocha/lib/stats-collector')

const makeWorker = () =>
  new Worker(require.resolve('./worker'), {
    // TODO stdout: true,
    // TODO stderr: true
  })

const map = async (tests, relayEvent) => {
  let failures = 0

  const out = []
  for (const fileAndOptions of tests) {
    const worker = makeWorker()

    const stats = await new Promise((resolve, reject) => {
      worker.on('message', ([event, payload]) => {
        if (event === 'mochallel:fin') {
          if (payload.error) {
            console.error('FATAL ERROR')
            console.error(payload.error)
            process.exit(1)
          } else {
            resolve(payload.stats)
          }
        } else {
          relayEvent(event, payload)
        }
      })

      worker.postMessage(fileAndOptions)
    })

    failures += stats.failures

    out.push(stats)

    worker.terminate()
  }

  return failures
}

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
    createStatsCollector(runner)
    /* eslint-disable-next-line */
    new this._reporter(runner, this.options)

    runner.emit('start')

    const relayEvent = (event, payload) => {
      if (event === 'pass') {
        payload.slow = () => 100
        runner.emit('pass', payload)
      } else if (event === 'fail') {
        const { title, message, stack } = payload

        const error = new Error(message)
        error.stack = stack

        runner.emit('fail', { title, fullTitle: () => title, titlePath: () => [title] }, error)
      } else {
        runner.emit(event, payload)
      }
    }

    map(testFiles, relayEvent).then(failures => {
      runner.emit('end')

      cb(failures)
    }).catch(error => {
      // Crash and burn, but report what we found
      console.error('UNEXPECTED MOCHALLEL ERROR:')
      console.error(error)
      process.exit(9)
    })

    return runner
  }
}
