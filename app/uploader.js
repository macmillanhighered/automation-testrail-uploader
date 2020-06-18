const { log } = require('@nodebug/logger')
const config = require('@nodebug/config')('testrail-uploader')
const api = require('./testrail').testRail()

async function uploadCases(payload, suite) {
  try {
    await api.setConnection(config.user)
  } catch (e) {
    log.error('Error while connecting to test rail')
    log.error(e)
    throw e
  }

  try {
    Array.from(payload.entries()).forEach(async (p) => {
      const [project, sections] = p
      const projectId = (await api.getProjectByName(project)).id
      const suiteId = (await api.addSuite(projectId, suite)).id
      Array.from(sections.entries()).forEach(async (s) => {
        const [section, cases] = s
        const sectionId = (await api.addSection(projectId, suiteId, section)).id
        Array.from(cases.entries()).forEach(async (c) => {
          const [, data] = c
          api.addCase(projectId, suiteId, sectionId, data.get('caseContent'))
        })
      })
    })
  } catch (e) {
    log.error('Error while uploading test cases to test rail')
    log.error(e)
    throw e
  }
}

async function uploadResults(payload, suite, run) {
  try {
    await api.setConnection(config.user)
  } catch (e) {
    log.error('Error while connecting to test rail')
    log.error(e)
    throw e
  }

  try {
    Array.from(payload.entries()).forEach(async (p) => {
      const [project, sections] = p
      const projectId = (await api.getProjectByName(project)).id
      const suiteId = (await api.addSuite(projectId, suite)).id
      await api.addTestRun(projectId, suiteId, run)
      const runId = (await api.getTestRunByName(projectId, run)).id
      Array.from(sections.entries()).forEach(async (s) => {
        const [section, cases] = s
        const sectionId = (await api.addSection(projectId, suiteId, section)).id
        Array.from(cases.entries()).forEach(async (c) => {
          const [scenario, data] = c
          const caseTitle = (
            await api.getCaseByName(projectId, suiteId, sectionId, scenario)
          ).title
          const testId = (await api.getTestByName(runId, caseTitle)).id
          api.addResult(testId, data.get('resultContent'))
        })
      })
    })
  } catch (e) {
    log.error('Error while uploading test results to test rail')
    log.error(e)
    throw e
  }
}

module.exports = {
  uploadCases,
  uploadResults,
}
