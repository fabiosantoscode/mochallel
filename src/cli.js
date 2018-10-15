'use strict'

const Mocha = require('..')
const yargs = require('yargs')

module.exports = (processArgv) => {
  const argv = yargs
    .boolean('bail')
    .option('compilers', {
      array: true,
      default: []
    })
    .boolean('delay')
    .string('grep')
    .boolean('enableTimeouts')
    .option('exit', { boolean: true })
    .number('slow')
    .option('require', {
      array: true,
      default: []
    })
    .number('retries')
    .number('timeout')
    .number('maxParallel')
    .parse(processArgv)

  const mocha = new Mocha(argv)

  argv._.forEach(file => { mocha.addFile(file) })

  mocha.run(code => {
    process.exit(code)
  })
}
