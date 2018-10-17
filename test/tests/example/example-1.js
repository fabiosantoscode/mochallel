const Promise = require('es6-promise')

describe('example', function () {
  it('foo', function () {
    return new Promise(function (resolve) { setTimeout(resolve, 250) })
  })
})
