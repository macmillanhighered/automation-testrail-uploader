const { log } = require('@nodebug/logger')
const fs = require('fs')
const jsonfile = require('jsonfile')
const path = require('path')

function readReport(config) {
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
        refs: scenario.tags
          .map(function getTag(tag) {
            return tag.name
          })
          .join(' '),
      }
      const resultContent = {
        status_id: 12,
        comment: 'This test was not executed',
        elapsed: '',
        custom_step_results: [],
        attachments: [],
      }
      caseContent.title = scenario.name
      const steps = caseContent.custom_steps_separated
      const logs = resultContent.custom_step_results
      /* eslint-disable no-restricted-syntax */
      for (let i = 0, j = -1; i < scenario.steps.length; i++) {
        if (
          Object.prototype.hasOwnProperty.call(scenario.steps[i], 'embeddings')
        ) {
          for (const attachment of scenario.steps[i].embeddings) {
            if (Object.prototype.hasOwnProperty.call(attachment, 'mime_type')) {
              resultContent.attachments.push(attachment)
            }
          }
        }
        if (
          scenario.steps[i].keyword === 'Before' &&
          scenario.steps[i].result.status === 'failed'
        ) {
          resultContent.comment = JSON.stringify(
            scenario.steps[i].result.error_message,
          )
        }
        if (
          scenario.steps[i].keyword !== 'After' &&
          scenario.steps[i].keyword !== 'Before'
        ) {
          j += 1
          steps[j] = {}

          let name =
            scenario.steps[i].keyword + scenario.steps[i].name.replace(/"/g, '')
          if (scenario.steps[i].arguments.length > 0) {
            for (const obj of scenario.steps[i].arguments) {
              if (Object.prototype.hasOwnProperty.call(obj, 'rows')) {
                for (let k = 0; k < obj.rows.length; k++) {
                  if (k === 0) {
                    name += `\n|||:${obj.rows[k].cells.join('|:')}\n`
                  } else {
                    name += `||${obj.rows[k].cells.join('|')}\n`
                  }
                }
              }
              break
            }
          }
          steps[j].content = name
          // steps[i].expected = 'Expected Result to be updated.';

          const stepResult = scenario.steps[i].result.status

          logs[j] = {}
          logs[j].content = name
          // logs[j].expected = 'Expected Result to be updated.';
          logs[j].actual = scenario.steps[i].result.error_message

          if (stepResult === 'passed') {
            resultContent.status_id = 1
            resultContent.comment = 'This test passed.'
            logs[j].status_id = 1
          } else if (stepResult === 'failed') {
            resultContent.status_id = 5
            resultContent.comment = 'This test failed.'
            logs[j].status_id = 5
          } else if (stepResult === 'undefined') {
            logs[j].status_id = 2
            logs[j].actual = 'Step Definition is not implemented.'
          } else if (stepResult === 'skipped') {
            logs[j].status_id = 3
            logs[j].actual = 'This step was skipped'
          }

          // const duration = parseInt(scenario.steps[i].result.duration);
          // if (duration !== undefined) {
          //   resultContent.elapsed += duration;
          // }
        }
      }
      /* eslint-enable no-restricted-syntax */
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
