const TestRailAPI = require('testrail-api')
const { log } = require('@nodebug/logger')

const that = {}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function testRail() {
  const my = {}
  my.connection = null

  that.setConnection = async (user) => {
    my.connection = new TestRailAPI(user)
  }

  // Test Project
  // Takes in a project name.
  // Returns the first instance of the matching project name.
  that.getProjectByName = async (projectName) => {
    try {
      const response = await my.connection.getProjects()
      const filter = response.body.projects.filter(
        (project) => project.name === projectName,
      )
      return filter[0]
    } catch (err) {
      log.error(JSON.stringify(err.message))
      throw err
    }
  }

  // Test Suites and Cases
  // Takes in a project id and a name of the suite.
  // Returns the first instance of the suite.
  that.getSuiteByName = async (projectId, suiteName) => {
    try {
      const response = await my.connection.getSuites(projectId)
      const filter = response.body.filter((suite) => suite.name === suiteName)
      return filter[0]
    } catch (err) {
      log.error(JSON.stringify(err.message))
      throw err
    }
  }

  // Takes in the project id and the suite name.  Checks to see if the suite exist.
  // If not, adds the suite to the given project.
  that.addSuite = async (projectId, suiteName) => {
    let suite = await that.getSuiteByName(projectId, suiteName)
    if (suite === undefined) {
      await my.connection.addSuite(projectId, {
        name: suiteName,
      })
      await sleep(5000)
      suite = await that.getSuiteByName(projectId, suiteName)
    }
    return suite
  }

  // Takes in a project id, suite id, and a name of the section.
  // Returns the first instance of the section.
  that.getSectionByName = async (projectId, suiteId, sectionName) => {
    try {
      const response = await my.connection.getSections(projectId, {
        suite_id: suiteId,
      })
      const filter = response.body.sections.filter(
        (section) => section.name === sectionName,
      )
      return filter[0]
    } catch (err) {
      log.error(JSON.stringify(err.message))
      throw err
    }
  }

  // Takes in the project id, suite id, and the section name.  Adds the section to the given suite.
  that.addSection = async (projectId, suiteId, sectionName) => {
    let section = await that.getSectionByName(projectId, suiteId, sectionName)
    if (section === undefined) {
      await my.connection.addSection(projectId, {
        suite_id: suiteId,
        name: sectionName,
      })
      await sleep(5000)
      section = await that.getSectionByName(projectId, suiteId, sectionName)
    }
    return section
  }

  // Takes in a project id, suite id, section id, and the name of the case.
  // Returns the first instance of the case.
  that.getCaseByName = async (projectId, suiteId, sectionId, caseName) => {
    try {
      const response = await my.connection.getCases(projectId, {
        suite_id: suiteId,
        section_id: sectionId,
      })
      const filter = response.body.cases.filter(
        (myCase) => myCase.title === caseName,
      )
      return filter[0]
    } catch (err) {
      log.error(JSON.stringify(err.message))
      throw err
    }
  }

  that.addCase = async (projectId, suiteId, sectionId, content) => {
    const Case = await that.getCaseByName(
      projectId,
      suiteId,
      sectionId,
      content.title,
    )
    if (Case === undefined) {
      await my.connection.addCase(sectionId, content)
    }
  }

  // Test Runs and Results
  that.getTestPlanByName = async (projectId, planName) => {
    try {
      const response = await my.connection.getPlans(projectId)
      const filter = response.body.plans.filter(
        (plan) => plan.name === planName,
      )
      return filter[0]
    } catch (err) {
      log.error(JSON.stringify(err.message))
      throw err
    }
  }

  that.addTestPlan = async (projectId, planName) => {
    let plan = await that.getTestPlanByName(projectId, planName)
    if (plan === undefined) {
      await my.connection.addPlan(projectId, {
        name: planName,
      })
      await sleep(5000)
      plan = await that.getTestPlanByName(projectId, planName)
    }
    return plan
  }

  that.addPlanEntry = async (planId, suiteId, suite) => {
    const response = await my.connection.addPlanEntry(planId, {
      suite_id: suiteId,
      name: suite,
      include_all: true,
    })
    await sleep(5000)
    return response.body.runs[0]
  }

  // Takes in a project id and a name of the run.  Returns the first instance of the run.
  that.getTestRunByName = async (projectId, runName) => {
    try {
      const response = await my.connection.getRuns(projectId)
      const filter = response.body.runs.filter((run) => run.name === runName)
      return filter[0]
    } catch (err) {
      log.error(JSON.stringify(err.message))
      throw err
    }
  }

  that.addTestRun = async (projectId, suiteId, runName) => {
    let run = await that.getTestRunByName(projectId, runName)
    if (run === undefined) {
      await my.connection.addRun(projectId, {
        suite_id: suiteId,
        name: runName,
        include_all: true,
      })
      await sleep(5000)
      run = await that.getTestRunByName(projectId, runName)
    }
    return run
  }

  // Takes in a plan id and the name of the case.  Returns the first instance of the test run.
  that.getTestByName = async (runId, caseName) => {
    try {
      const response = await my.connection.getTests(runId, {})
      const filter = response.body.tests.filter(
        (test) => test.title === caseName,
      )
      return filter[0]
    } catch (err) {
      log.error(JSON.stringify(err.message))
      throw err
    }
  }

  that.addResult = async (testId, content) =>
    my.connection.addResult(testId, content)

  return that
}

module.exports = {
  testRail,
}
