const { log } = require('@nodebug/logger')
const fs = require('fs')
const jsonfile = require('jsonfile')
const path = require('path')
const config = require('./config')

function readReport() {
  let retVal
  let report

  if (config.f !== undefined) {
    const { f } = config
    if (f.includes('.json')) {
      report = f.replace('json:', './')
    }
  }

  if (report === undefined) {
    if (config.reportPath !== undefined) {
      report = config.reportPath
    } else {
      return retVal
    }
  }

  try {
    log.debug(`Report path is ${report}`)
    if (!path.isAbsolute(report)) {
      log.debug(`Report path ${report} is not absolute. Resolving path`)
      report = path.resolve(report)
    }

    if (fs.existsSync(report)) {
      log.debug(`Reading report from ${report}`)
      retVal = jsonfile.readFileSync(report)
    } else {
      log.debug('No report exists at given path')
    }
  } catch (e) {
    log.error(`Error while reading report from path ${report}`)
    log.error(e)
  }
  return retVal
}

async function parseReport(p) {
  const content = new Map()

  await p.forEach((feature) => {
    const [, project] = feature.uri.split('/')

    if (!content.has(project)) {
      content.set(project, new Map())
    }

    const section = feature.name
    if (!content.get(project).has(section)) {
      content.get(project).set(section, new Map())
    }

    feature.elements.forEach((scenario) => {
      if (!content.get(project).get(section).has(scenario.name)) {
        content.get(project).get(section).set(scenario.name, new Map())
      }
      const caseContent = {
        type_id: 1,
        priority_id: 5,
        estimate: '20m',
        custom_steps_separated: [],
      }
      const resultContent = {
        status_id: 12,
        comment: 'This test was not executed',
        elapsed: '',
        custom_step_results: [],
      }
      caseContent.title = scenario.name
      const steps = caseContent.custom_steps_separated
      const logs = resultContent.custom_step_results
      for (let i = 0; i < scenario.steps.length; i += 1) {
        if (
          scenario.steps[i].keyword !== 'After' &&
          scenario.steps[i].keyword !== 'Before'
        ) {
          steps[i] = {}
          steps[i].content =
            scenario.steps[i].keyword + scenario.steps[i].name.replace(/"/g, '')
          // steps[i].expected = 'Expected Result to be updated.';

          let stepResult = scenario.steps[i].result.status
          if (stepResult === 'passed') {
            stepResult = 1
            resultContent.status_id = 1
            resultContent.comment = 'This test passed.'
          } else if (stepResult === 'failed') {
            stepResult = 5
            resultContent.status_id = 5
            resultContent.comment = 'This test failed.'
          } else if (stepResult === 'skipped') {
            stepResult = 12
          }

          logs[i] = {}
          logs[i].content =
            scenario.steps[i].keyword + scenario.steps[i].name.replace(/"/g, '')
          // logs[i].expected = 'Expected Result to be updated.';
          logs[i].actual = scenario.steps[i].result.status
          logs[i].status_id = stepResult

          // const duration = parseInt(scenario.steps[i].result.duration);
          // if (duration !== undefined) {
          //   resultContent.elapsed += duration;
          // }
        }
      }
      content
        .get(project)
        .get(section)
        .get(scenario.name)
        .set('caseContent', caseContent)
      content
        .get(project)
        .get(section)
        .get(scenario.name)
        .set('resultContent', resultContent)
    })
  })
  return content
}

module.exports = {
  readReport,
  parseReport,
}
