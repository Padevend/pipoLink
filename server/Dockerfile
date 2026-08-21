# ── Base ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base

# Variables pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Installer pnpm via npm — PATH /pnpm toujours accessible
RUN npm install -g pnpm@9.15.4

WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps

COPY package.json ./ 
COPY pnpm-lock.yaml ./
COPY prisma.config.js ./ 
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Générer le client Prisma
RUN pnpm db:generate

# Compiler TypeScript
RUN pnpm build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
ENV PORT=2654

# pnpm + pm2
RUN npm install -g pnpm@9.15.4 pm2

WORKDIR /app

COPY --from=builder /app/node_modules      ./node_modules
COPY --from=builder /app/dist              ./dist
COPY --from=builder /app/package.json      ./package.json
COPY --from=builder /app/generated         ./dist/generated
COPY --from=builder /app/src/templates     ./src/templates
COPY --from=builder /app/prisma            ./prisma
COPY --from=builder /app/prisma.config.js  ./prisma.config.js
# COPY service-account.json                 ./service-account.json
# COPY google-drive-credentials.json        ./google-drive-credentials.json
COPY ecosystem.config.cjs                  ./ecosystem.config.cjs
COPY entrypoint.sh                         ./entrypoint.sh

RUN mkdir -p logs && chmod +x entrypoint.sh

EXPOSE 2654

ENTRYPOINT ["./entrypoint.sh"]