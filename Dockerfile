FROM node:20

LABEL org.opencontainers.image.source=https://github.com/Decatur-Robotics/Gearbox
LABEL org.opencontainers.image.description="Gearbox"
LABEL org.opencontainers.image.licenses=CC-BY-NC-SA-4.0

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .

RUN npm run build

EXPOSE 80

# ENTRYPOINT [ "bash" ] # Uncomment to operate the terminal in the container
CMD ["/usr/local/bin/npm", "run", "start"]