#!/bin/sh
set -e

echo "===================================="
echo "  PipoLink Backend - Démarrage"
echo "===================================="

# echo "🗄️  Migration Prisma..."
# node_modules/.bin/prisma migrate deploy

echo "🚀 Démarrage PM2..."
exec pm2-runtime start ecosystem.config.cjs
