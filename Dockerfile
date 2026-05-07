# syntax=docker/dockerfile:1.7
# Multi-stage Next.js standalone build with native better-sqlite3 compilation.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Build deps for better-sqlite3 (and any other native modules).
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Persistent SQLite path — Fly mounts a volume here.
ENV DB_PATH=/data/app.db

# litestream binary for streaming SQLite backups to S3-compatible storage.
ARG LITESTREAM_VERSION=0.3.13
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl \
  && curl -fsSL "https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-linux-amd64.tar.gz" \
     | tar -xz -C /usr/local/bin litestream \
  && apt-get purge -y curl \
  && rm -rf /var/lib/apt/lists/*

# Non-root user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone output already includes the bare-minimum node_modules.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Runtime helpers.
COPY --chown=nextjs:nodejs litestream.yml /etc/litestream.yml
COPY --chown=nextjs:nodejs scripts/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Volume mount point.
RUN mkdir -p /data && chown nextjs:nodejs /data
VOLUME ["/data"]

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

CMD ["/app/start.sh"]
