# Puppeteer(Chrome headless node API) based web page renderer
This project is based on [zenato/puppeteer-renderer](https://github.com/zenato/puppeteer-renderer).

[Puppeteer](https://github.com/GoogleChrome/puppeteer) (Chrome headless node API) based web page renderer.

Useful server side rendering through proxy. Outputs HTML, PDF and screenshots as PNG or JPEG.

## Requirements
Docker

## Start server using docker.
`docker run -d --name renderer -p 8080:3000 digitalist/alpine-puppeteer-renderer`

### Test on your browser
Input url `http://localhost:8080/?url=https://www.google.com`

If you can see a html page (yes it will be broken - not the same for pdf and screenshots), server works fine.

## Integration with existing service.

If you have active service, set proxy configuration with middleware.
See [puppeteer-renderer-middleware](middleware/README.md) for express.

```js
const renderer = require('puppeteer-renderer-middleware');

const app = express();

app.use(renderer({
  url: 'http://installed-your-puppeteer-renderer-url',
  // userAgentPattern: /My-Custom-Agent/i,
  // excludeUrlPattern: /*.html$/i
  // timeout: 30 * 1000,
}));

// your service logics..

app.listen(8080);
```

## API

| Name        | Required | Value               | Default            |Description                                                       |
|-------------|:--------:|:-------------------:|------------------------|--------------------------------------------------------------|
|`url`        | yes      |       url           |                        | Target URL                                                   |
|`variant`    |          |`pdf`, `screenshot`  |                        | Rendering another type.                                      |
|`type`        |          |    `jpeg`, `png`    |  `png`                | Image output type                                            |
|`isMobile`   |          |`true`, `false`      | `false`                | Emulate mobile                                               |
|`width`        |          | number   |      `800`                      | Width of screenshot                                          |
|`height`        |          | number  |      `600`                      | Height of screenshot                                         |
|`media`   |          |`print`, `screen`      | `print`                 | CSS media type                                               |
|`deviceScaleFactor`   |          |number     | `1`                     | Device scale                                                 |
|`jsEnabled`   |          |`true`, `false`     | `true`                 | Enable javascript                                            |
|`hasTouch`   |          |`true`, `false`     | `false`                 | Emulate touch                                                |
|`isLandscape`   |          |`true`, `false`     | `false`              | Emualte landscape                                            |
|`waitUntil`   |          |`load`, `domcontentloaded`, `networkidle0`, `networkidle2`    | `networkidle0`    | When considered done loading page|
|`timeout`        |          | number  |      `30000`                   | Request timeout time                                         |
|`quality`        |          | number  |      `100`                     | Quality of output image, only valid for jpeg, errors on png |

### Examples

```
http://localhost:8080/?url=https://www.google.com&type=png&width=1200&height=800&variant=screenshot
```
Outputs a screenshot of google in png format, width 1200 and height 800.


```
http://localhost:8080/?url=https://www.google.com&type=jpeg&width=1200&height=800&variant=screenshot&quality=80
```
Outputs a screenshot of google in jpeg format, in 80% quality, width 1200 and height 800
