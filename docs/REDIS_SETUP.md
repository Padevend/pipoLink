# Installation, Configuration et Déploiement de Redis pour PipoLink

Ce document décrit la mise en place de Redis comme système de messagerie Pub/Sub pour gérer l'architecture WebSocket. Cela permet le "clustering" et l'équilibrage de charge si vous décidez d'utiliser plusieurs instances de votre backend.

---

## 1. Comment obtenir et héberger Redis (Méthodes)

### Option A : Déploiement via Docker sur votre VPS (Recommandé et Gratuit)
C'est la méthode la plus simple car elle est incluse dans le `docker-compose.yml` du projet. Elle est gérée en même temps que le backend.

### Option B : Redis Cloud Managé (Pour la Haute Disponibilité)
Si vous ne voulez pas gérer l'instance Redis sur votre VPS, vous pouvez utiliser un service cloud gratuit ou payant.
1. Allez sur [Redis Cloud](https://redis.com/try-free/) ou [Upstash](https://upstash.com/).
2. Créez un compte et une base de données Redis gratuite.
3. Copiez l'URL de connexion qui vous est fournie (ex: `redis://default:password@eu1-redis-db.upstash.io:30000`).

---

## 2. Déploiement sur le Serveur VPS (Option A Docker)

### Étape 1 : Envoyer le fichier de configuration (Docker Compose)
Vous devez envoyer le fichier `docker-compose.yml` présent à la racine du projet vers votre serveur. Depuis le terminal de votre ordinateur :

```bash
# S'assurer que le dossier existe sur le VPS
ssh user@VOTRE_IP_SERVEUR "mkdir -p /chemin/vers/PipoLink"

# Transférer le fichier docker-compose.yml
scp ./docker-compose.yml user@VOTRE_IP_SERVEUR:/chemin/vers/PipoLink/docker-compose.yml
```

### Étape 2 : Configurer le fichier `.env` du serveur
Connectez-vous à votre serveur en SSH :
```bash
ssh user@VOTRE_IP_SERVEUR
cd /chemin/vers/PipoLink/server
```

Dans le fichier `.env` du backend, ajoutez l'URL Redis :
```env
# Si vous utilisez le docker-compose local du VPS :
REDIS_URL=redis://redis:6379

# Si vous utilisez un Redis Managé Cloud (Option B) :
# REDIS_URL=redis://default:votre_mot_de_passe@l-url-de-votre-service:port
```

### Étape 3 : Démarrer l'infrastructure
Exécutez la commande suivante sur votre VPS, dans le répertoire contenant le fichier `docker-compose.yml` :
```bash
docker compose up -d
```
Cela démarrera automatiquement Redis et votre Backend, et les connectera entre eux.

---

## 3. Détails de la Configuration Interne

Le fichier `docker-compose.yml` à la racine du projet gère l'exécution de Redis de manière transparente avec le backend.

```yaml
  redis:
    image: redis:7-alpine
    container_name: pipolink-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
```

Le service backend `api` dépend de `redis` et s'y connecte de manière privée via le réseau Docker. L'application (via `ioredis` dans le code TypeScript) adaptera automatiquement son comportement. Si `REDIS_URL` est renseigné, les WebSockets passeront par le Pub/Sub. Sinon, PipoLink repassera en mode "mémoire locale".

---

## 4. Procédures de vérification sur le VPS

Pour vérifier que Redis fonctionne correctement sur votre VPS :

1. **Vérifier le conteneur** :
   ```bash
   docker ps | grep pipolink-redis
   ```
2. **Tester la connexion Redis** :
   ```bash
   docker exec -it pipolink-redis redis-cli ping
   ```
   *Réponse attendue : `PONG`*

3. **Surveiller les événements en direct** :
   Pour voir si vos messages transitent correctement dans le broker Pub/Sub Redis :
   ```bash
   docker exec -it pipolink-redis redis-cli
   SUBSCRIBE pipolink:ws:events
   ```
   *Envoyez un message dans l'application mobile, vous verrez le flux de données en direct.*

---

## 5. Dépannage courant

- **Erreur `ECONNREFUSED 127.0.0.1:6379`** : 
  Cela signifie que le backend essaie de se connecter en local mais ne trouve pas Redis. Vérifiez que la variable `REDIS_URL` pointe bien vers le nom du conteneur `redis://redis:6379` (pour Docker) et non localhost.
- **Sécurité** : Si vous installez Redis en dehors de Docker de façon brute, **bloquez toujours le port 6379** avec votre pare-feu VPS (`ufw deny 6379`), sinon n'importe qui sur Internet pourrait accéder à vos données. Avec `docker-compose`, Docker isole le réseau par défaut, mais attention si vous exposez le port publiquement.
