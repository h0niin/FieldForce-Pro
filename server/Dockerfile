# syntax=docker/dockerfile:1
# ── Stage 1: Install dependencies (production only) ────────
FROM node:20-alpine AS deps

RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# ── Stage 2: Build TypeScript ──────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build

# ── Stage 3: Production runtime ───────────────────────────
FROM node:20-alpine AS runtime

RUN apk add --no-cache \
    wget \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/package.json ./package.json

# Copy sequelizerc if it exists
COPY --from=builder /app/.sequelizerc* ./

# Copy AI knowledge base so AiService can load it at runtime
COPY --from=builder /app/docs ./docs

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3213

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3213/api/docs || exit 1

CMD ["node", "dist/src/main.js"]
