FROM node:22-alpine AS base

WORKDIR /app

# Dependencies 
FROM base AS deps

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

# Builder 
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run db:generate
RUN npm run build

# Garder uniquement les dépendances de production
RUN npm ci --omit=dev

# Runner 
FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PORT=2654

# PM2 via npm — PATH géré automatiquement
RUN npm install -g pm2

WORKDIR /app

COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/dist            ./dist
COPY --from=builder /app/package.json    ./package.json
COPY --from=builder /app/prisma          ./prisma
COPY ecosystem.config.cjs                ./ecosystem.config.cjs

RUN mkdir -p logs

EXPOSE 2654

CMD npx prisma migrate deploy && pm2-runtime start ecosystem.config.cjs