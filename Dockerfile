FROM node:14-alpine

WORKDIR /app/@maxxton/microdocs-core

# Install microdocs-server
ADD ./package.json ./.npmrc ./
RUN npm install

# Build microdocs-server
ADD ./src ./src
ADD ./gulpfile.js ./build.js ./
RUN ./node_modules/.bin/gulp prepublish
CMD rm -rf /app/@maxxton/microdocs-core/dist/* && ./node_modules/.bin/gulp watch
