const { _makeWorker } = require('..')
const assert = require('assert').strict

describe.skip('worker', () => {
  let worker
  beforeEach(() => {
    worker = _makeWorker()
  })
  afterEach(() => {
    worker.terminate()
  })
  it('pongs our pings', (done) => {
    worker.postMessage({ type: 'TEST-PING' })
    worker.on('message', message => {
      assert.deepEqual(message, { type: 'PONG' })
      done()
    })
  })
})
