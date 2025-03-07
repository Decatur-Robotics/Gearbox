FROM node:20

LABEL org.opencontainers.image.source=https://github.com/Decatur-Robotics/Gearbox
LABEL org.opencontainers.image.description="Gearbox"
LABEL org.opencontainers.image.licenses=CC-BY-NC-SA-4.0

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 80

ARG GIT_SHA
ARG DEPLOY_ID

ENV GIT_SHA=${GIT_SHA}
ENV DEPLOY_ID=${DEPLOY_ID}

RUN echo "-----------------"
RUN echo "Environment Variables:"
RUN echo "GIT_SHA=${GIT_SHA}"
RUN echo "DEPLOY_ID=${DEPLOY_ID}"
RUN echo "-----------------"

# ENTRYPOINT [ "bash" ] # Uncomment to operate the terminal in the container
CMD ["/usr/local/bin/npm", "run", "start"]