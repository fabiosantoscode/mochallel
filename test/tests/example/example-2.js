describe('example 2', function () {
  this.timeout(4000)
  it('foo 2', function () {
    return new Promise(function (resolve) { setTimeout(resolve, 1500) })
  })
})
