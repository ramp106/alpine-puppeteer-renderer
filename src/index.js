'use strict'

const express = require('express')
const { URL } = require('url')
const contentDisposition = require('content-disposition')
const puppeteer = require('puppeteer-core')
const port = process.env.PORT || 3000

const app = express()

let renderer = null

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
      await page.setDefaultNavigationTimeout(0)

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
// Configure.
app.disable('x-powered-by')

// Render url.
app.use(async (req, res, next) => {
  let { url, type, variant, ...options } = req.query

  if (!url) {
    return res.status(400).send('You must provide an URL argument, like ?url=http://yourdomain')
  }

  if (!url.includes('://')) {
    url = `http://${url}`
  }

  try {
    switch (type) {
      case 'png':
        var typeImage = 'image/png'
        break
      case 'jpeg':
        var typeImage = 'image/jpeg'
        break
      default:
        var typeImage = 'image/png'
    }
  } catch (e) {
    next(e)
  }

  try {
    switch (variant) {
      case 'pdf':
        const urlObj = new URL(url)
        let filename = urlObj.hostname
        if (urlObj.pathname !== '/') {
          filename = urlObj.pathname.split('/').pop()
          if (filename === '') filename = urlObj.pathname.replace(/\//g, '')
          const extDotPosition = filename.lastIndexOf('.')
          if (extDotPosition > 0) filename = filename.substring(0, extDotPosition)
        }
        const pdf = await renderer.pdf(url, options)
        res
          .set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdf.length,
            'Content-Disposition': contentDisposition(filename + '.pdf'),
          })
          .send(pdf)
        break

      case 'screenshot':
        const image = await renderer.screenshot(url, type, options)
        res
          .set({
            'Content-Type': typeImage,
            'Content-Length': image.length,
          })
          .send(image)
        break

      default:
        const html = await renderer.render(url, options)
        res.status(200).send(html)
    }
  } catch (e) {
    next(e)
  }
})

// Error page.
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).send('Ooops! An unexpected error seems to have occurred.')
})

function updateBrowser(createdRenderer) {
    renderer = createdRenderer
}

async function create () {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_BIN || null,
    args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
  })
  browser.on('disconnected', async () => {
    console.log('Browser crashed, restarting')
    let renderer = await create()
    updateBrowser(renderer)
  });

  console.log(`Started Puppeteer with pid ${browser.process().pid}`);

  
  return new Renderer(browser)
}

// Create renderer and start server.
create()
  .then(createdRenderer => {
    renderer = createdRenderer
    console.info('Initialized renderer.')
    app.listen(port, () => {
      console.info(`Listen port on ${port}.`)
    })
  })
  .catch(e => {
    console.error('Fail to initialze renderer.', e)
  })

// Terminate process
process.on('SIGINT', () => {
  process.exit(0)
})


