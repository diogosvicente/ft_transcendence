FROM node:20-alpine

WORKDIR /app

COPY ./client-pong/package*.json .

RUN npm install

COPY ./client-pong/ .

EXPOSE 5173

CMD ["npm", "run", "dev-exposed"]