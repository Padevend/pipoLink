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
COPY prisma.config.ts ./ 
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

# Dépendances production uniquement
RUN pnpm install --frozen-lockfile --prod

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
COPY --from=builder /app/prisma            ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY ecosystem.config.cjs                  ./ecosystem.config.cjs

RUN mkdir -p logs

EXPOSE 2654

CMD npx prisma migrate deploy && pm2-runtime start ecosystem.config.cjs