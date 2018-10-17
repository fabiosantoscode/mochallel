'use strict'

const fs = require('fs')
const Mocha = require('..')
const program = require('commander')

module.exports = () => {
  let inputFiles = ['test']
  program
    .option('--bail')
    .option('--compilers')
    .option('--delay [n]')
    .option('--grep [s]')
    .option('--enableTimeouts')
    .option('--exit')
    .option('--slow [t]')
    .option('--require')
    .option('--retries')
    .option('--timeout')
    .option('--maxParallel')
    .arguments('[...files]')
    .action(files => {
      console.log({files})
      inputFiles = files
    })
    .parse(process.argv)


  program.compilers = program.compilers || []
  program.require = program.require || []

  const mocha = new Mocha(program)

  inputFiles.forEach(file => {
    if (fs.existsSync(file)) mocha.addFile(file)
  })

  mocha.run(code => {
    process.exit(code)
  })
}
