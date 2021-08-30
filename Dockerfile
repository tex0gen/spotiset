FROM node:16
WORKDIR .
COPY package*.json ./
RUN npm install
WORKDIR backend
RUN npm install
WORKDIR ../
COPY . .
EXPOSE 3000
CMD [ "npm", "start" ]