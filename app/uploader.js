const { log } = require('@nodebug/logger')
const config = require('@nodebug/config')('testrail-uploader')
const Uploader = require('./testrailapi')
const api = require('./testrail').testRail()

async function uploadCases(payload, project, suite) {
  try {
    await api.setConnection(config.user)
  } catch (e) {
    log.error('Error while connecting to test rail')
    log.error(JSON.stringify(e))
    throw e
  }

  try {
    const prject = await api.getProjectByName(project)
    log.info(`Connected to TestRail Project ${project}`)
    const sute = await api.addSuite(prject.id, suite)
    log.info(`Uploading test cases to Suite ${suite}`)

    const cucumberResults = Array.from(payload.entries())
    /* eslint-disable no-restricted-syntax,no-await-in-loop */
    for (const p of cucumberResults) {
      const [, sections] = p
      const cucumberSections = Array.from(sections.entries())
      for (const s of cucumberSections) {
        const [section, cases] = s
        const sction = await api.addSection(prject.id, sute.id, section)
        const cucumberCases = Array.from(cases.entries())
        for (const c of cucumberCases) {
          const [, data] = c
          await api.addCase(
            prject.id,
            sute.id,
            sction.id,
            data.get('caseContent'),
          )
        }
      }
    }
    /* eslint-disable no-restricted-syntax,no-await-in-loop */
  } catch (e) {
    log.error('Error while uploading test cases to test rail')
    log.error(JSON.stringify(e))
    throw e
  }
}

async function uploadResults(payload, project, suite, plan) {
  try {
    await api.setConnection(config.user)
  } catch (e) {
    log.error('Error while connecting to test rail')
    log.error(JSON.stringify(e))
    throw e
  }

  const uploader = new Uploader(config)

  try {
    const prject = await api.getProjectByName(project)
    log.info(`Connected to TestRail Project ${project}`)
    const pln = await api.addTestPlan(prject.id, plan)
    log.info(`Fetching Test Plan ${plan}`)
    const sute = await api.getSuiteByName(prject.id, suite)
    const run = await api.addPlanEntry(pln.id, sute.id, suite)
    log.info(`Adding Test Run ${suite}`)

    const cucumberResults = Array.from(payload.entries())
    /* eslint-disable no-restricted-syntax,no-await-in-loop */
    for (const p of cucumberResults) {
      const [, sections] = p
      const cucumberSections = Array.from(sections.entries())
      for (const s of cucumberSections) {
        const [section, cases] = s
        const sction = await api.getSectionByName(prject.id, sute.id, section)
        const cucumberCases = Array.from(cases.entries())
        for (const c of cucumberCases) {
          const [scenario, data] = c
          const caseTitle = (
            await api.getCaseByName(prject.id, sute.id, sction.id, scenario)
          ).title
          const test = await api.getTestByName(run.id, caseTitle)
          const result = await api.addResult(test.id, data.get('resultContent'))
          await uploader.uploadAttachments(
            result.body.id,
            data.get('resultContent').attachments,
          )
        }
      }
    }
    /* eslint-enable no-restricted-syntax,no-await-in-loop */
  } catch (e) {
    log.error('Error while uploading test results to test rail')
    log.error(JSON.stringify(e))
    throw e
  }
}

module.exports = {
  uploadCases,
  uploadResults,
}
