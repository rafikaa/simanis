FROM node:13.5.0-alpine3.11

COPY . .
RUN yarn

CMD yarn start