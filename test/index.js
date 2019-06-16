'use strict'

var assert = require('assert')
var path = require('path')
var exec = require('child_process').exec
var Mochallel = require('..')

describe('mochallel', function () {
  this.timeout(16 * 1000)
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
    exec('node bin/mochallel test/tests/example', function (err, stdout, stderr) {
      if (err) throw err
      stdout = stdout.toString()
      if (!/2 passing/.test(stdout)) {
        const scissors = '---- 8< ----'
        console.log('FAILURE: incorrect output:\n' + scissors)
        console.log(stdout)
        console.log(scissors)
        throw new Error('did not find expected string in stdout (look at the cutout above)')
      }
      done()
    })
  })
})
