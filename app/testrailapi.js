const axios = require('axios')
const { log } = require('@nodebug/logger')
const FormData = require('form-data')
const fs = require('fs')

class Uploader {
  /* eslint-disable no-underscore-dangle */
  get project() {
    return this._project
  }

  get suite() {
    return this._suite
  }

  get section() {
    return this._section
  }

  constructor(config) {
    this.host = config.user.host
    this.uri = 'index.php?/api/v2/'
    this.auth = Buffer.from(
      `${config.user.user}:${config.user.password}`,
    ).toString('base64')
  }

  async uploadAttachments(resultId, attachments) {
    log.info(`Uploading attachment to test result`)
    /* eslint-disable no-restricted-syntax */
    for (const attachment of attachments) {
      const filename = `reports/${Date.now()}${attachment.mime_type.replace(
        '/',
        '.',
      )}`
      const fileContents = Buffer.from(attachment.data, 'base64')
      fs.writeFileSync(filename, fileContents)

      const form = new FormData()
      form.append('attachment', fs.createReadStream(filename))

      const config = {
        method: 'post',
        url: `${this.host}${this.uri}add_attachment_to_result/${resultId}`,
        headers: {
          ...form.getHeaders(),
          Authorization: `Basic ${this.auth}`,
        },
        data: form,
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        await axios(config)
        try {
          fs.unlinkSync(filename)
        } catch (e1) {
          log.error(e1.message)
        }
      } catch (e) {
        log.error(e.message)
        try {
          fs.unlinkSync(filename)
        } catch (e2) {
          log.error(e2.message)
        }
        throw e
      }
    }
    /* eslint-disable no-restricted-syntax */
  }

  async setProject(projectName) {
    log.info(`Fetching project by name ${projectName}`)
    let projects
    const url = `${this.host}${this.uri}get_projects`
    const config = {
      method: 'get',
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.auth}`,
      },
    }
    try {
      const response = await axios(config)
      projects = response.data.projects.filter(
        (project) => project.name === projectName,
      )
    } catch (e) {
      log.error(e.message)
      throw e
    }
    const [p] = projects
    this._project = p
    return p
  }

  async setSuite(suiteName) {
    log.info(`Fetching suite by name ${suiteName}`)
    let suites
    const url = `${this.host}${this.uri}get_suites/${this.project.id}`
    const config = {
      method: 'get',
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.auth}`,
      },
    }
    try {
      const response = await axios(config)
      suites = response.data.filter((suite) => suite.name === suiteName)
    } catch (e) {
      log.error(e.message)
      throw e
    }
    const [s] = suites
    this._suite = s
    return s
  }

  async addSuite(suiteName) {
    log.info(`Add suite by name ${suiteName}`)
    let suite
    const url = `${this.host}${this.uri}add_suite/${this.project.id}`
    const data = {
      name: suiteName,
      description: 'Use the description to add additional context details',
    }
    const config = {
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.auth}`,
      },
      data,
    }
    try {
      const response = await axios(config)
      suite = response.data
    } catch (e) {
      log.error(e.message)
      throw e
    }
    return suite
  }

  async setSection(sectionName) {
    log.info(`Fetching suite by name ${sectionName}`)
    let sections
    const url = `${this.host}${this.uri}get_sections/${this.project.id}&suite_id=${this.suite.id}`
    const config = {
      method: 'get',
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.auth}`,
      },
    }
    try {
      const response = await axios(config)
      sections = response.data.filter((section) => section.name === sectionName)
    } catch (e) {
      log.error(e.message)
      throw e
    }
    const [s] = sections
    this._section = s
    return s
  }
  /* eslint-enable no-underscore-dangle */
}

module.exports = Uploader
