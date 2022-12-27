FROM node:16-alpine AS builder
WORKDIR /app
COPY . /app

RUN apk add --no-cache libc6-compat

RUN npm ci

WORKDIR /app/server
RUN npm ci

WORKDIR /app

RUN npm run build

# Production image, copy all the files and run next
FROM node:16-alpine AS runner
WORKDIR /app

COPY --from=builder /app/ ./

EXPOSE 8080

CMD ["npm", "run", "server"]