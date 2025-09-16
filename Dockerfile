# Multi-stage Dockerfile for Fisher Backflows Production Deployment
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci --only=production; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create necessary directories
RUN mkdir -p logs backups

# Build the application with memory optimization
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV NODE_OPTIONS="--max-old-space-size=16384"

RUN \
  if [ -f package-lock.json ]; then npm run build-minimal; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create fisher user for security
RUN addgroup --system --gid 1001 fisher
RUN adduser --system --uid 1001 fisher

# Install production dependencies and security tools
RUN apk add --no-cache \
    curl \
    dumb-init \
    tzdata \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Set timezone
ENV TZ=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY --from=builder /app/public ./public
COPY --from=builder --chown=fisher:fisher /app/.next/standalone ./
COPY --from=builder --chown=fisher:fisher /app/.next/static ./.next/static

# Create required directories with proper permissions
RUN mkdir -p logs backups temp && chown -R fisher:fisher logs backups temp

# Health check
COPY --chown=fisher:fisher docker/healthcheck.js ./healthcheck.js
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js

USER fisher

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Development stage
FROM base AS development
WORKDIR /app

RUN apk add --no-cache libc6-compat curl git

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Production is the default
FROM runner AS production