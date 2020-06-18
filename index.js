const { log } = require('@nodebug/logger')
const config = require('@nodebug/config')('testrail-uploader')
const uploader = require('./app/uploader')
const cuke = require('./app/cucumber')

log.debug(JSON.stringify(config))

async function uploadToTestRail(run) {
  if (config.upload === true) {
    const s = config.testSuite
    const r = `${config.testRun} ${run}`

    const report = await cuke.readReport()
    if (report !== undefined) {
      const payload = await cuke.parseReport(report)
      await uploader.uploadCases(payload, s)
      await uploader.uploadResults(payload, s, r)
    }
  }
}

module.exports = {
  uploadToTestRail,
}
