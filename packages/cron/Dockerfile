FROM node:20-bullseye AS deps

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV production

#? Copy the necessary files to install dependencies
COPY package*.json .
COPY packages/lib/package*.json ./packages/lib/
COPY packages/cron/package*.json ./packages/cron/

RUN npm i --only=production

FROM node:20-bullseye AS runner

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY --from=deps /usr/src/app .

COPY packages/cron ./packages/cron
COPY packages/lib ./packages/lib


COPY packages/app/prisma/schema.prisma ./packages/app/prisma/schema.prisma
RUN cd packages/app && npx prisma generate

# Install pg_dump
RUN echo "deb http://apt.postgresql.org/pub/repos/apt bullseye-pgdg main" > /etc/apt/sources.list.d/postgres.list
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN apt-get update && apt-get install -y postgresql-client-13 postgresql-client-14 postgresql-client-15

CMD ["npm", "start", "-w", "packages/cron"]