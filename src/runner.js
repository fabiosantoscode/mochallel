'use strict'

const Mocha = require('mocha')
const circularJson = require('circular-json')

process.on('message', (msg) => {
  const { type, file, options } = circularJson.parse(msg)
  if (type === 'test') {
    const mocha = new Mocha(options)
    global.mocha = mocha
    mocha.addFile(file)
    mocha.run((code) => {
      process.send(circularJson.stringify({ code }))
    })
  }
})

process.send(null)
