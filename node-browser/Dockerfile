FROM node:16.0.0-bullseye-slim

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i
RUN npm install -g @angular/cli

COPY . .