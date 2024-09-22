#!/usr/bin/env node

/**
 * @remarks Drop-in replacement for the [SAM cli](https://github.com/aws/aws-sam-cli).
 *
 * Expands the template in [expand](./expand.js).
 *
 * @module
 **/

import expand from './expand.js'

await expand()
