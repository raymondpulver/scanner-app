FROM node:12
WORKDIR /app
COPY . .
RUN yarn
ENTRYPOINT ["yarn", "start"]
