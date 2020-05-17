describe('example', function () {
  it('foo', function () {
    console.log('Testing stdout')
    console.error('Test stderr')
    return new Promise(function (resolve) { setTimeout(resolve, 250) })
  })
})
