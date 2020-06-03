const { log } = require('@tapack/logger')
const config = require('./app/config')

log.debug(JSON.stringify(config))
