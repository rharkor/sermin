FROM node:20-alpine AS deps

RUN apk add --no-cache openssl
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


FROM node:20-alpine AS builder

RUN apk add --no-cache openssl
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

COPY --from=deps /usr/src/app .

COPY packages/lib ./packages/lib
COPY packages/cron ./packages/cron
COPY packages/app ./packages/app

RUN npm run build -w packages/app


FROM node:20-alpine AS runner

RUN apk add --no-cache openssl
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV PORT 3000
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

COPY --from=builder /usr/src/app .

EXPOSE 3000

CMD [ "npm", "run", "start:wss", "-w", "packages/app" ]
