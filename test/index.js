'use strict'

var assert = require('assert')
var path = require('path')
var Mochallel = require('..')

describe('mochallel', function () {
  it('can spawn parallel mocha processes', function (done) {
    this.timeout(4 * 1000)
    var mocha = new Mochallel({ maxParallel: 1 })
    mocha.addFile(path.join(__dirname, 'tests/example'))
    mocha.run(function (code) {
      done()
    })
  })
  it('can run failing tests', function (done) {
    this.timeout(4 * 1000)
    var mocha = new Mochallel({ maxParallel: 1 })
    mocha.addFile(path.join(__dirname, 'tests/failing-test'))
    mocha.run(function (code) {
      assert.strictEqual(code, 1)
      done()
    })
  })
})
