FROM node:8.1-alpine

WORKDIR /app/@maxxton/microdocs-core

# Install Dependencies
ADD ./package.json ./
RUN yarn setup && yarn cache clean

# Build
ADD ./tsconfig.json ./tslint.json ./
ADD ./src ./src
RUN yarn run compile && yarn run tslint
CMD rm -rf /app/@maxxton/microdocs-core/dist/* && yarn run watch