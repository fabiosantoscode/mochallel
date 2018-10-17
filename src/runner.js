'use strict'

const circularJson = require('circular-json')
const Mocha = require('mocha')

process.on('message', msg => {
  const { type, file, options } = circularJson.parse(msg)

  if (type === 'test') {
    const mocha = new Mocha(options)
    mocha.addFile(file)
    mocha.run((code) => {
      process.send(JSON.stringify({ code }))
    })
  }
})

process.send('')
