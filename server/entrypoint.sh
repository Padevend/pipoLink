# entrypoint.sh — à la racine du projet server
#!/bin/sh
set -e

echo "🗄️  Migration Prisma..."
pnpm db:migrate-deploy

echo "🚀 Démarrage PM2..."
exec pm2-runtime start ecosystem.config.cjs