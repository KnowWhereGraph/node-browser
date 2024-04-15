FROM node:20.12-bullseye-slim

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i
RUN npm install -g @angular/cli

COPY . .
