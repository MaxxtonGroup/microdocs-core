FROM node:8.1-alpine

WORKDIR /app/@maxxton/microdocs-core

# Install Dependencies
ADD ./package.json ./
RUN yarn setup && yarn cache clean

# Build
ADD ./tsconfig.json ./tsconfig.build.json ./tslint.json ./
CMD ["yarn", "run", "watch"]