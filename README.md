# mochallel
Mocha tests running in parallel

## comparison with mocha-parallel-tests
This module was inspired in mocha-parallel-tests, but instead of going the same route, it went into a simpler pathway, where options are just wired into the real mocha module, and it uses a generic pool from another npm module.

## How to use

Use just exactly like mocha.

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
