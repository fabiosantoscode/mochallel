'use strict'

var assert = require('assert')
var path = require('path')
var child_process = require('child_process')
var Mochallel = require('..')

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
  it('CLI works', function (done) {
    child_process.exec('bin/mochallel test/tests/example', function (err, stdout, stderr) {
      if (err) throw err
      assert(/2 passing/.test(stdout))
      done()
    })
  })
})
