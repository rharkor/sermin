FROM node:20-alpine AS deps

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV production

#? Copy the necessary files to install dependencies
COPY package*.json .
COPY packages/lib/package*.json ./packages/lib/
COPY packages/cron/package*.json ./packages/cron/

RUN npm i --only=production

FROM node:20-alpine AS builder

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY --from=deps /usr/src/app .

COPY packages/cron ./packages/cron
COPY packages/lib ./packages/lib

RUN npm run build -w packages/cron

FROM node:20-alpine AS runner

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/packages/cron .
COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY packages/app/prisma/schema.prisma ../app/prisma/schema.prisma
RUN npx prisma generate

CMD ["npm", "start"]