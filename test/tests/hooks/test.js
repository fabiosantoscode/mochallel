
describe('hi', () => {
  before(() => {
    console.log('before')
  })
  after(() => {
    console.log('after')
  })
  beforeEach(() => {
    console.log('beforeEach')
  })
  afterEach(() => {
    console.log('afterEach')
  })
  it('foo', () => {
    console.log('it')
  })
})
