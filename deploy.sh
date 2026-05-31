#!/bin/bash
# deploy.sh — Script de déploiement PipoLink
set -e

if ! docker ps > /dev/null 2>&1; then
    exec sg docker "$0" "$@"
fi

PROJECT_DIR=~/Documents/pipolink
cd "$PROJECT_DIR" || { echo "❌ Dossier $PROJECT_DIR introuvable"; exit 1; }

echo "🚀 Début du déploiement..."

# ── 1. Mise à jour du code ────────────────────────────────────────────────────
echo "📥 Pull branche main..."
git fetch origin main
git checkout main
git stash
git reset --hard origin/main

# ── 2. Build et lancement des conteneurs ─────────────────────────────────────
echo "🏗️  Build Docker Compose..."
docker-compose up -d --build

# ── 3. Migrations Prisma ──────────────────────────────────────────────────────
echo "🗄️  Exécution des migrations Prisma..."
docker-compose exec -T backend npx prisma migrate deploy

# ── 4. Vérification du conteneur ─────────────────────────────────────────────
echo "🔍 Vérification du statut..."
sleep 5  # laisser le temps au conteneur de démarrer

if docker ps --format '{{.Names}}' | grep -q "pipolink-backend"; then
    echo "✅ Conteneur pipolink-backend en cours d'exécution"
else
    echo "❌ Conteneur pipolink-backend non démarré — logs :"
    docker-compose logs --tail=80 backend
    exit 1
fi

# ── 5. Health check ───────────────────────────────────────────────────────────
echo "🏥 Health check..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:2654/health || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ API répond correctement (HTTP 200)"
else
    echo "⚠️  API health check : HTTP $HTTP_STATUS"
    echo "   Logs récents :"
    docker-compose logs --tail=30 backend
fi

# ── 6. Nettoyage images ───────────────────────────────────────────────────────
echo "🧹 Nettoyage des anciennes images..."
docker image prune -f

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Déploiement terminé avec succès"
echo "  📍 API : http://127.0.0.1:2654"
echo "  🌐 Public : https://api-plink.lyrastudio.org"
echo "═══════════════════════════════════════════"