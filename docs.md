# Documentation de Déploiement - PipoLink

Ce document décrit la procédure de déploiement automatique du backend de PipoLink sur un Serveur Privé Virtuel (VPS) en utilisant GitHub Actions et Docker.

## Architecture de Déploiement

- **Branche `dev`** : Utilisée pour le développement continu et les tests.
- **Branche `main`** : Branche de production. Tout *push* ou *merge* sur cette branche déclenche le déploiement automatique via GitHub Actions.
- **Docker & Docker Compose** : Le serveur Node.js et la base de données PostgreSQL sont conteneurisés pour assurer un environnement reproductible et isolé.
- **PM2 (cluster mode)** : À l'intérieur du conteneur Docker, l'application tourne avec PM2 en mode cluster (2 instances) pour la résilience et le redémarrage automatique en cas de crash.
- **Port** : L'application écoute sur le port **2654** en interne.
- **Nginx** : Fait office de reverse-proxy sur le VPS pour exposer l'API sur les ports 80/443 avec le domaine `api-plink.lyrastudio.org`.
- **SSL/TLS** : Géré par Certbot (Let's Encrypt) avec renouvellement automatique.

## Prérequis sur le VPS

1. **Serveur Linux** (ex: Ubuntu 20.04/22.04 ou Debian).
2. **Git** installé (`sudo apt install git`).
3. **Docker** et **Docker Compose** installés.
4. **Nginx** installé (`sudo apt install nginx`).
5. **Clé SSH** configurée pour l'accès depuis GitHub Actions.
6. **Certbot** installé pour les certificats SSL (`sudo apt install certbot python3-certbot-nginx`).
7. Clone initial du dépôt sur le VPS :
   ```bash
   git clone <url-du-repo-github> ~/pipolink
   ```
8. Fichier `.env` configuré :
   Copiez le fichier `server/.env.example` en `server/.env` et renseignez les variables de production (mots de passe, clés JWT, etc.) directement sur le VPS.

## Configuration GitHub Secrets

Pour que GitHub Actions puisse se connecter à votre VPS et lancer le déploiement, vous devez configurer les "Secrets" suivants dans votre dépôt GitHub (`Settings` > `Secrets and variables` > `Actions` > `New repository secret`) :

- `VPS_HOST` : L'adresse IP de votre VPS (ex: `123.45.67.89`).
- `VPS_USERNAME` : L'utilisateur SSH (ex: `root` ou `ubuntu`).
- `VPS_PORT` : Le port SSH (généralement `22`).
- `VPS_SSH_KEY` : La clé privée SSH (contenu du fichier `~/.ssh/id_rsa` du client/VPS).

## Fichiers de Déploiement

### 1. `server/Dockerfile`

- Basé sur `node:20-alpine`.
- Utilise une compilation multi-étapes (multi-stage build) pour réduire la taille de l'image de production.
- Construit l'application avec `pnpm`, génère le client Prisma, puis lance les migrations avant de démarrer le serveur.
- Installe **PM2 globalement** et l'utilise via `pm2-runtime` pour lancer l'application (cluster mode, 2 instances).
- Le port exposé est **2654**.

### 2. `docker-compose.yml`

- Définit les services `backend` et `db` (PostgreSQL).
- Le backend expose le port **2654** (et non 3000).
- Monte les volumes pour conserver la base de données (`postgres_data`) et les fichiers stockés (`server/storage`).

### 3. `server/ecosystem.config.cjs`

Fichier de configuration PM2 :

```javascript
module.exports = {
  apps: [
    {
      name: 'pipolink-backend',
      script: 'dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 5000,
      kill_timeout: 5000,
    },
  ],
};
```

### 4. `deploy.sh`

- Script shell utilisé par la CI/CD.
- Se place dans `~/pipolink` (chemin du projet sur le VPS).
- Met à jour le code (`git pull origin main`), reconstruit et redémarre les conteneurs (`docker compose up -d --build`).
- Vérifie que le conteneur tourne.
- Nettoie les anciennes images Docker inutilisées.

### 5. `.github/workflows/deploy.yml`

- Le workflow GitHub Actions. Il se déclenche uniquement sur la branche `main`.
- Se connecte au VPS via SSH en utilisant les secrets GitHub.
- Exécute le script `deploy.sh`.

---

## Configuration Nginx (Reverse-Proxy)

Créez un fichier de configuration Nginx pour le sous-domaine `api-plink.lyrastudio.org` :

```nginx
# /etc/nginx/sites-available/api-plink.lyrastudio.org

server {
    listen 80;
    server_name api-plink.lyrastudio.org;

    # Redirection vers HTTPS (activé après Certbot)
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api-plink.lyrastudio.org;

    # Certificats SSL (gérés par Certbot, chemins par défaut)
    ssl_certificate /etc/letsencrypt/live/api-plink.lyrastudio.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-plink.lyrastudio.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy inverse vers le conteneur backend
    location / {
        proxy_pass http://127.0.0.1:2654;
        proxy_http_version 1.1;

        # Headers pour WebSocket (si l'API utilise des WebSockets)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Headers standards
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
    }

    # Limiter la taille des uploads (pour les fichiers/images)
    client_max_body_size 50M;
}
```

**Activation du site :**

```bash
sudo ln -s /etc/nginx/sites-available/api-plink.lyrastudio.org /etc/nginx/sites-enabled/
sudo nginx -t          # Vérifier la syntaxe
sudo systemctl reload nginx
```

---

## Configuration SSL avec Certbot (Let's Encrypt)

Une fois Nginx configuré avec le bloc `listen 80` et que le DNS pointe vers votre VPS, exécutez :

```bash
# Installer Certbot (si pas déjà fait)
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat SSL (Nginx doit être en écoute sur le port 80)
sudo certbot --nginx -d api-plink.lyrastudio.org

# Suivez les instructions interactives :
#   - Entrez votre email (pour les notifications d'expiration)
#   - Acceptez les conditions d'utilisation
#   - Choisissez de rediriger HTTP vers HTTPS (option 2)

# Vérifier le renouvellement automatique (le service est installé par défaut)
sudo certbot renew --dry-run
```

Certbot installe automatiquement un timer systemd pour le renouvellement. Les certificats sont renouvelés automatiquement tous les 60 jours.

---

## Configuration DNS — Guide Spaceship (spaceShip)

Le nom de domaine utilisé est `lyrastudio.org`, avec le sous-domaine `api-plink.lyrastudio.org`.

### Étape 1 : Accéder à Spaceship

1. Connectez-vous sur [spaceship.com](https://www.spaceship.com)
2. Allez dans **Domaines** > sélectionnez `lyrastudio.org` > cliquez sur **DNS & Nameservers**

### Étape 2 : Ajouter un enregistrement DNS de type A

| Champ          | Valeur                                         |
|----------------|-------------------------------------------------|
| **Type**       | `A`                                             |
| **Name / Host**| `api-plink` *(le sous-domaine, sans le domaine principal)* |
| **Value**      | `<ADRESSE_IP_DE_VOTRE_VPS>`                     |
| **TTL**        | `3600` (1 heure) — ou `300` pour les tests      |

### Étape 3 : Sauvegarder

Cliquez sur **Add Record** puis **Save Zone**.

### Étape 4 : Vérifier la propagation DNS

```bash
# Depuis votre machine locale ou le VPS
dig api-plink.lyrastudio.org +short
# ou
nslookup api-plink.lyrastudio.org
```

La propagation peut prendre de quelques minutes à 24 heures.

### Variante : Enregistrement CNAME (si vous utilisez un reverse-proxy différent)

Si vous préférez pointer vers un autre nom d'hôte plutôt qu'une IP directe :

| Champ          | Valeur                                         |
|----------------|-------------------------------------------------|
| **Type**       | `CNAME`                                         |
| **Name / Host**| `api-plink`                                     |
| **Value**      | `votre-serveur.example.com`                     |
| **TTL**        | `3600`                                          |

---

## Comment déployer

1. Développez et testez vos fonctionnalités sur la branche `dev`.
2. Lorsque vous êtes prêt pour la mise en production, faites une Pull Request (ou un merge direct) de `dev` vers `main`.
3. Poussez vers `main` :
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```
4. GitHub Actions prend automatiquement le relais :
   - Se connecte en SSH au VPS
   - Exécute `deploy.sh` :
     - `git pull origin main`
     - `docker compose up -d --build` (reconstruit l'image backend avec PM2)
     - Vérifie que le conteneur tourne
     - Nettoie les anciennes images Docker
5. L'API est accessible sur `https://api-plink.lyrastudio.org` (via Nginx → port 2654 → conteneur backend avec PM2 cluster mode).

---

## Dépannage

### Voir les logs du conteneur

```bash
docker compose logs -f backend
```

### Voir les logs PM2 (à l'intérieur du conteneur)

```bash
docker exec -it pipolink-backend pm2 logs
```

### Redémarrer manuellement

```bash
cd ~/pipolink && docker compose restart backend
```

### Re-générer le certificat SSL

```bash
sudo certbot --nginx -d api-plink.lyrastudio.org --force-renewal
```

### Vérifier le statut du renouvellement automatique

```bash
sudo systemctl status certbot.timer
```