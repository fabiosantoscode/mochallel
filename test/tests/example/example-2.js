const Promise = require('es6-promise')

describe('example 2', function () {
  it('foo 2', function () {
    return new Promise(function (resolve) { setTimeout(resolve, 250) })
  })
})
