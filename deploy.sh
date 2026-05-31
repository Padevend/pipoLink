#!/bin/bash
# Script de déploiement manuel/automatique sur VPS
# Utilisé par GitHub Actions (SSH) ou en manuel

# Arrêter le script en cas d'erreur
set -e

echo "🚀 Début du déploiement..."

# Aller dans le dossier du projet (À adapter selon le chemin sur le VPS)
PROJECT_DIR=~/Documents/pipolink
cd "$PROJECT_DIR" || { echo "❌ Dossier $PROJECT_DIR introuvable"; exit 1; }

# 1. Mettre à jour le code depuis la branche 'main' (Production)
echo "📥 Récupération des dernières mises à jour (branche main)..."
git checkout main
git pull origin main

# 2. Rebuild et redémarrage via Docker Compose
echo "🏗️  Construction et lancement des conteneurs avec Docker Compose..."
docker compose up -d --build

# 3. Initialiser/redémarrer l'application avec PM2 dans le conteneur
echo "⚙️  Configuration de PM2 (cluster mode - 2 instances)..."
# (PM2 tourne à l'intérieur du conteneur via pm2-runtime dans le CMD du Dockerfile)

# 4. Vérifier que le conteneur tourne
echo "🔍 Vérification du statut..."
if docker ps | grep -q pipolink-backend; then
    echo "✅ Conteneur pipolink-backend en cours d'exécution"
else
    echo "⚠️  Le conteneur pipolink-backend ne semble pas démarré — vérification des logs..."
    docker compose logs --tail=50 backend
    exit 1
fi

# 5. Nettoyer les anciennes images Docker non utilisées
echo "🧹 Nettoyage des anciennes images Docker..."
docker image prune -f

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Déploiement terminé avec succès"
echo "  📍 API accessible sur le port 2654"
echo "  🔄 Reverse-proxy Nginx attendu sur api-plink.lyrastudio.org"
echo "═══════════════════════════════════════════"