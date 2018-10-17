'use strict'

var Mochallel = require('..')
var path = require('path')

describe('mochallel', function () {
  it('can spawn parallel mocha processes', function (done) {
    this.timeout(10 * 1000)
    var mocha = new Mochallel({ maxParallel: 1 })
    mocha.addFile(path.join(__dirname, 'tests/example'))
    mocha.run(function (code) {
      done()
    })
  })
})
