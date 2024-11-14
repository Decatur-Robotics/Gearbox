FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .

EXPOSE 443

CMD npm run build && npm run start