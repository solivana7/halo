# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --include=dev

# ---- builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3030
ENV HOSTNAME=0.0.0.0
ENV HALO_DATA_DIR=/data

# Run as root so we can write to the Railway-mounted volume at /data.
# Railway mounts volumes owned by root and we cannot chown after the mount.
# This is an internal tool — root in container is acceptable.
RUN mkdir -p /data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3030
# Ensure /data is usable at runtime even if the volume mount overlay
# created a fresh empty directory we need to write to.
CMD ["sh", "-c", "mkdir -p /data && chmod 777 /data && exec node server.js"]
