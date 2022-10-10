FROM node:16-alpine AS builder
WORKDIR /app
COPY . /app

RUN apk add --no-cache libc6-compat
# RUN yarn install --frozen-lockfile
# RUN yarn npm login
RUN yarn --frozen-lockfile
WORKDIR /app/server
RUN yarn --frozen-lockfile
WORKDIR /app

# RUN npx browserslist@latest --update-db && yarn build
RUN yarn build

# Production image, copy all the files and run next
FROM node:16-alpine AS runner
WORKDIR /app

# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S nextjs -u 1001

# COPY --from=builder --chown=nextjs:nodejs /app/ ./

COPY --from=builder /app/ ./

# USER nextjs

EXPOSE 8080

CMD ["yarn", "server"]