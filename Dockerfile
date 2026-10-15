FROM node:14-alpine@sha256:434215b487a329c9e867202ff89e704d3a75e554822e07f3e0c0f9e606121b33

WORKDIR /app/@maxxton/microdocs-core

# Install microdocs-server
ADD ./package.json ./.npmrc ./
RUN npm install

# Build microdocs-server
ADD ./src ./src
ADD ./gulpfile.js ./build.js ./
RUN ./node_modules/.bin/gulp prepublish
CMD rm -rf /app/@maxxton/microdocs-core/dist/* && ./node_modules/.bin/gulp watch
