'use strict'

const Mochallel = require('..')
const path = require('path')

describe('mochallel', () => {
  it('can spawn parallel mocha processes', done => {
    const mocha = new Mochallel({ maxParallel: 1 })
    mocha.addFile(path.join(__dirname, 'tests/example'))
    mocha.run((code) => {
      console.log({ code })
      done()
    })
  })
})
