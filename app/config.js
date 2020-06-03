const fs = require('fs')

const root = process.env.PWD
const appName = require('../package.json').name.split('/').pop()

const defaultConfigPath = `${root}/.config/${appName}.json`

let defaultConfig
if (fs.existsSync(defaultConfigPath)) {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  defaultConfig = require(defaultConfigPath)
}

// eslint-disable-next-line global-require
const config = () => require('rc')(appName, defaultConfig)

module.exports = config()
