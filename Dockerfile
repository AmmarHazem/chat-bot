FROM node:18-alpine

RUN apk update && apk add python3

RUN apk --no-cache add build-base

ENV mode PROD

WORKDIR /hubspot-webhook-service

COPY ./package.json .

RUN npm install -g typescript

RUN npm install

COPY . .

RUN tsc

EXPOSE 8000:8000

CMD ["npm", "run", "start"]
