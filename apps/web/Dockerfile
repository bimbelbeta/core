FROM oven/bun:1-alpine AS base

FROM base AS configs
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Accept build-time env vars for Vite
ARG VITE_SERVER_URL
ARG VITE_MIDTRANS_CLIENT_KEY
ARG VITE_PAYMENTS_ENABLED
ENV VITE_SERVER_URL=${VITE_SERVER_URL}
ENV VITE_MIDTRANS_CLIENT_KEY=${VITE_MIDTRANS_CLIENT_KEY}
ENV VITE_PAYMENTS_ENABLED=${VITE_PAYMENTS_ENABLED}

FROM base AS installer
WORKDIR /usr/src/app

COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/
COPY packages/contract/package.json ./packages/contract/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/

RUN bun install

FROM configs AS builder
ARG TURBO_TEAM
ARG TURBO_TOKEN
ARG VITE_SERVER_URL
ARG VITE_MIDTRANS_CLIENT_KEY
ARG VITE_PAYMENTS_ENABLED
ENV TURBO_TEAM=${TURBO_TEAM}
ENV TURBO_TOKEN=${TURBO_TOKEN}
ENV VITE_SERVER_URL=${VITE_SERVER_URL}
ENV VITE_MIDTRANS_CLIENT_KEY=${VITE_MIDTRANS_CLIENT_KEY}
ENV VITE_PAYMENTS_ENABLED=${VITE_PAYMENTS_ENABLED}
WORKDIR /usr/src/app

COPY --from=installer /usr/src/app ./
COPY . .
RUN bunx turbo build --filter=web

FROM configs AS runner
COPY --from=builder /usr/src/app/apps/web/.output/ .

EXPOSE 3000
CMD ["bun", "./server/index.mjs"]


