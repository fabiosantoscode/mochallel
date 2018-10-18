'use strict'

const Mocha = require('mocha')

process.on('message', ({ type, file, options }) => {
  if (type === 'test') {
    const mocha = new Mocha(options)
    mocha.addFile(file)
    mocha.run((code) => {
      process.send(JSON.stringify({ code }))
    })
  }
})

process.send(null)
