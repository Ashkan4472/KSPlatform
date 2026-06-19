# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
# openssl is required by Prisma; libc6-compat helps native deps on alpine.
RUN apk add --no-cache libc6-compat openssl

# --- Install dependencies ---
FROM base AS deps
COPY package.json package-lock.json ./
# Use `npm install` (not `npm ci`): the lockfile committed from macOS omits
# Linux-only optional deps (e.g. @emnapi/*), which `npm ci` rejects.
# Skip the postinstall "prisma generate" here (schema not copied yet).
RUN npm install --no-audit --no-fund --ignore-scripts

# --- Build the app ---
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder so prisma.config.ts can resolve env() at build time.
# Prisma generate / next build never connect to this; the real URL is
# injected at runtime via docker-compose.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `npm run build` runs `prisma generate && next build`.
RUN npm run build

# --- Production runner ---
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next.js standalone server (bundles the app + a pruned node_modules).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Full node_modules (superset of the standalone's pruned set) so the Prisma CLI
# and its config loader work for `migrate deploy` at startup.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
