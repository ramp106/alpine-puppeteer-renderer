FROM node:11-alpine

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    NODE_ENV="production"
RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    dumb-init \
    udev \
    ttf-freefont \
    chromium \
    && npm install puppeteer-core@2.0.0 --silent \
      \
      # Do some cleanup
      && apk del --no-cache make gcc g++ python binutils-gold gnupg libstdc++ \
      && rm -rf /usr/include \
      && echo
COPY . /app
RUN cd /app && npm install --quiet && rm -rf /var/cache/apk/* /root/.node-gyp /usr/share/man /tmp/* \
EXPOSE 3000
WORKDIR /app
ENTRYPOINT ["/usr/bin/dumb-init"]
CMD npm run start
