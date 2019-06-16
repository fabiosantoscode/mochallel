# mochallel

[![Build Status](https://travis-ci.org/fabiosantoscode/mochallel.svg?branch=master)](https://travis-ci.org/fabiosantoscode/mochallel) [![Coverage Status](https://coveralls.io/repos/github/fabiosantoscode/mochallel/badge.svg?branch=master)](https://coveralls.io/github/fabiosantoscode/mochallel?branch=master)

Mocha tests running in parallel

## comparison with mocha-parallel-tests
This module was inspired in `mocha-parallel-tests`, but attempts to be a simpler implementation, where options are just wired into the real `mocha` module.

## How to use

Use exactly like mocha.

```bash
mochallel --maxParallel 2 --timeout 2000 --slow 500 path/to/your/tests
```

Use the `--maxParallel <n>` option to specify how many parallel processes you want.

The other options are exactly like mocha.

## How to use (API)

Use exactly like mocha.

```javascript
const Mochallel = require('mochallel')

const mocha = new Mochallel({ maxParallel: 2 })
mocha.addFile('path/to/your/tests')
mocha.run(code => {
    process.exit(code)
})
```

Use the `maxParallel` option to specify how many parallel processes you want.

All other options exactly like mocha.
