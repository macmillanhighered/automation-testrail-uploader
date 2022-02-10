const config = require('@nodebug/config')('testrail-uploader')
const uploader = require('./app/uploader')
const cuke = require('./app/cucumber')

async function uploadToTestRail() {
  if (JSON.parse(config.upload) === true) {
    const report = await cuke.readReport(config)
    if (report !== undefined) {
      const payload = await cuke.parseReport(report)
      await uploader.uploadCases(payload, config.project, config.testSuite)
      await uploader.uploadResults(
        payload,
        config.project,
        config.testSuite,
        config.testPlan,
      )
    }
  }
}

uploadToTestRail()

module.exports = {
  uploadToTestRail,
}
