FROM node:16-alpine AS builder
WORKDIR /app
COPY . /app

RUN apk add --no-cache libc6-compat
COPY .yarnrc ./
COPY .npmrc ./

RUN yarn --frozen-lockfile

WORKDIR /app/server
RUN yarn --frozen-lockfile

WORKDIR /app

RUN yarn build

# Production image, copy all the files and run next
FROM node:16-alpine AS runner
WORKDIR /app

COPY --from=builder /app/ ./

EXPOSE 8080

CMD ["yarn", "server"]