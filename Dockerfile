FROM node:13.5.0-alpine3.11

COPY package.json yarn.lock ./
RUN yarn
COPY . .

EXPOSE 8888

CMD yarn start