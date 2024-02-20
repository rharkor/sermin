FROM node:20-bullseye AS deps

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV production

#? Copy the necessary files to install dependencies
COPY package*.json .
COPY packages/lib/package*.json ./packages/lib/
COPY packages/cron/package*.json ./packages/cron/
COPY packages/app/package*.json ./packages/app/
COPY packages/app/prisma/schema.prisma ./packages/app/prisma/schema.prisma

RUN npm i --only=production


FROM node:20-bullseye AS builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

COPY --from=deps /usr/src/app .

COPY packages/lib ./packages/lib
COPY packages/cron ./packages/cron
COPY packages/app ./packages/app

RUN npm run build -w packages/app


FROM node:20-bullseye AS runner

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV PORT 3000
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

COPY --from=builder /usr/src/app .

# Install pg_dump
RUN echo "deb http://apt.postgresql.org/pub/repos/apt bullseye-pgdg main" > /etc/apt/sources.list.d/postgres.list
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN apt-get update && apt-get install -y postgresql-client-13 postgresql-client-14 postgresql-client-15

EXPOSE 3000

CMD [ "npm", "start", "-w", "packages/app" ]
