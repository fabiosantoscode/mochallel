const { parentPort, isMainThread } = require('worker_threads')
const util = require('util')
const assert = require('assert').strict
const Mocha = require('mocha')

assert.equal(isMainThread, false, 'Mochallel worker must be called using worker_threads')

const postMessage = message => parentPort.postMessage(message)

function Reporter (runner) {
  // TODO pass hook events
  // start/end events emitted outside worker
  // delay events purposefully not passed on
  runner.on('suite', suite => {
    postMessage(['suite', { title: suite.title }])
  })
  runner.on('suite end', suite => {
    postMessage(['suite end', { title: suite.title }])
  })
  runner.on('test', test => {
    postMessage(['test', { title: test.title }])
  })
  runner.on('test end', test => {
    postMessage(['test end', { title: test.title }])
  })
  runner.on('pass', test => {
    postMessage(['pass', { title: test.title, duration: test.duration }])
  })
  runner.on('pending', test => {
    postMessage(['pending', { title: test.title }])
  })
  runner.on('fail', (test, err) => {
    postMessage([
      'fail',
      { title: test.title, message: err.message, stack: err.stack }
    ])
  })
  // retry event purposefully not sent
}

async function runTest ({ file, options }) {
  const mocha = new Mocha(Object.assign({}, options, { reporter: Reporter }))
  mocha.addFile(file)

  return new Promise(resolve => {
    const runner = mocha.run((result) => {
      resolve((runner && runner.stats) || { failures: 1 })
    })
  })
}

parentPort.on('message', ({ file, options }) => {
  console.log('DOING', file)
  runTest({ file, options })
    .then(stats => parentPort.postMessage(['mochallel:fin', { stats }]))
    .catch(error => parentPort.postMessage(['mochallel:fin', { error: util.inspect(error) }]))
    .then(() => {
      console.log('DONE WITH', file)
    })
})
