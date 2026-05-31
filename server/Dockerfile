FROM node:22-alpine AS base

# Installer pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Définir le dossier de travail
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
# Installer toutes les dépendances (y compris dev pour le build)
RUN pnpm install --frozen-lockfile

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Générer le client Prisma et compiler TypeScript
RUN pnpm db:generate
RUN pnpm build
# Ne garder que les dépendances de production pour alléger l'image
RUN pnpm install --frozen-lockfile --prod

# ---- Runner ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=2654

# Installer PM2 globalement
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm add -g pm2

# Copier les node_modules de production et les fichiers compilés
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Copier la configuration PM2 ecosystem
COPY ecosystem.config.cjs ./ecosystem.config.cjs

# Créer le dossier logs pour PM2
RUN mkdir -p logs

# Exposer le port de l'application
EXPOSE 2654

# Lancer la migration de la DB puis le serveur avec PM2
CMD npx prisma migrate deploy && pm2-runtime start ecosystem.config.cjs