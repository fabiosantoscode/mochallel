'use strict'

var assert = require('assert')
var path = require('path')
var Mochallel = require('../src')
var sinon = require('sinon')

describe('mochallel', function () {
  this.timeout(4 * 1000)
  it('can spawn parallel mocha processes', function (done) {
    var mocha = new Mochallel({ maxParallel: 1 })
    mocha.addFile(path.join(__dirname, 'tests/example'))
    mocha.run(function (code) {
      done()
    })
  })
  it('can run failing tests', function (done) {
    var mocha = new Mochallel({ maxParallel: 1 })
    mocha.addFile(path.join(__dirname, 'tests/failing-test'))
    mocha.run(function (code) {
      assert.strictEqual(code, 1)
      done()
    })
  })
  it('prints a message on long-running tests', function (done) {
    var mocha = new Mochallel()
    mocha.addFile(path.join(__dirname, 'tests/long-running'))
    sinon.spy(console, 'log')
    var clock = sinon.useFakeTimers()
    mocha.run(function (code) {
      assert.strictEqual(code, 0)
      console.log(console.log.callCount)
      assert(console.log.called)
      done()
    })
    clock.tick(6 * 60 * 1000)
  })
})
