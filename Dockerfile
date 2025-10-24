FROM node:24

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY index.js ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT [ "/app/docker-entrypoint.sh" ]
