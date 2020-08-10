FROM node:alpine3.12

COPY . .

RUN yarn install

ENTRYPOINT ["node", "index"]
