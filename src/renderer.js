'use strict'

const puppeteer = require('puppeteer-core')

class Renderer {
  constructor(browser) {
    this.browser = browser
  }

  async createPage(url, options = {}) {
    const { timeout, waitUntil, ...extraOptions } = options
    const page = await this.browser.newPage()

    await page.goto(url, {
      timeout: Number(extraOptions.timeout || 30 * 1000),
      waitUntil: String(extraOptions.waitUntil || 'networkidle0'),
    })
    return page
  }

  async render(url, options = {}) {
    let page = null
    try {
      const { timeout, waitUntil } = options
      page = await this.createPage(url, { timeout, waitUntil })
      const html = await page.content()
      return html
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  async pdf(url, options = {}) {
    let page = null
    try {
      const { timeout, waitUntil, ...extraOptions } = options
      page = await this.createPage(url, { timeout, waitUntil })

      const { scale, displayHeaderFooter, printBackground, landscape } = extraOptions
      const buffer = await page.pdf({
        ...extraOptions,
        scale: Number(scale),
        displayHeaderFooter: displayHeaderFooter === 'true',
        printBackground: printBackground === 'true',
        landscape: landscape === 'true',
      })
      return buffer
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  async screenshot(url, type, options = {}) {
    let page = null
    try {
      const { timeout, waitUntil, ...extraOptions } = options
      page = await this.createPage(url, { timeout, waitUntil })

      const {
        width,
        height,
        isMobile,
        deviceScaleFactor,
        hasTouch,
        isLandscape,
        media,
        JSenabled,
      } = extraOptions
      await page.setViewport({
        width: Number(width || 800),
        height: Number(height || 600),
        isMobile: Boolean(isMobile || false),
        deviceScaleFactor: Number(deviceScaleFactor || 1),
        hasTouch: Boolean(hasTouch || false),
        isLandscape: Boolean(isLandscape || false),
      })

      var mediaType = String(media || 'screen')
      var jsEnabled = Boolean(JSenabled || true)
      await page.emulateMedia(mediaType)
      await page.setJavaScriptEnabled(jsEnabled)

      //await page.addScriptTag({content: 'alert("foo")'})
      //await page.addStyleTag({content: 'body {background-color:red}'})

      const { fullPage, omitBackground, quality } = extraOptions

      const buffer = await page.screenshot({
        ...extraOptions,
        type: type,
        quality: Number(quality) || (type === undefined || type == 'png' ? 0 : 100),
        fullPage: fullPage === 'true',
        omitBackground: omitBackground === 'true',
      })
      return buffer
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  async close() {
    await this.browser.close()
  }
}

async function create() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_BIN || null,
    args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
  })
  return new Renderer(browser)
}

module.exports = create
