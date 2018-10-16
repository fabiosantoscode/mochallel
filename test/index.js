'use strict'

const Mochallel = require('..')
const path = require('path')

describe('mochallel', () => {
  it('can spawn parallel mocha processes', function (done) {
    this.timeout(10 * 1000)
    const mocha = new Mochallel({ maxParallel: 1 })
    mocha.addFile(path.join(__dirname, 'tests/example'))
    mocha.run((code) => {
      console.log({ code })
      done()
    })
  })
})
