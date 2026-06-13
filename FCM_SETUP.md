# Intégration et Déploiement de Firebase Cloud Messaging (FCM)

Ce document décrit comment le système de notifications Push de PipoLink a été configuré, ainsi que la procédure exacte pour le déployer sur votre serveur de production.

---

## 1. Récupération des Clés Firebase (Liens directs)

Pour que FCM fonctionne, vous avez besoin de deux fichiers d'authentification générés par Firebase :

### A. Le fichier `service-account.json` (Pour le Backend)
Ce fichier permet au backend de s'authentifier auprès de Google pour envoyer les notifications.
1. Allez sur la [Console Firebase - Comptes de service](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk).
2. Sélectionnez votre projet PipoLink.
3. Cliquez sur le bouton **Générer une nouvelle clé privée**.
4. Téléchargez le fichier, et renommez-le en `service-account.json`.

### B. Le fichier `google-services.json` (Pour l'application Mobile Android)
Ce fichier connecte l'application mobile React Native à votre projet Firebase.
1. Allez sur la [Console Firebase - Paramètres généraux](https://console.firebase.google.com/project/_/settings/general).
2. Faites défiler jusqu'à la section **Vos applications**, puis sélectionnez votre application Android.
3. Cliquez sur **google-services.json** pour le télécharger.
4. Placez-le à la racine du dossier `app/` sur votre machine locale avant de lancer le build (`eas build -p android`).

---

## 2. Déploiement sur le Serveur (Backend)

### Transfert du fichier vers le serveur
Vous devez envoyer de manière sécurisée le fichier `service-account.json` vers votre serveur VPS (ne jamais le commiter sur Git !).

Ouvrez votre terminal local et utilisez la commande `scp` pour copier le fichier :

```bash
# Créez le dossier config s'il n'existe pas
ssh user@VOTRE_IP_SERVEUR "mkdir -p /chemin/vers/PipoLink/server/config"

# Copiez le fichier depuis votre ordinateur vers le serveur VPS
scp ./service-account.json user@VOTRE_IP_SERVEUR:/chemin/vers/PipoLink/server/config/service-account.json
```

*(Remplacez `user`, `VOTRE_IP_SERVEUR` et `/chemin/vers/PipoLink` par vos vraies informations de connexion)*.

### Configuration du fichier `.env` sur le serveur
Connectez-vous à votre serveur :
```bash
ssh user@VOTRE_IP_SERVEUR
cd /chemin/vers/PipoLink/server
```

Éditez le fichier `.env` (`nano .env`) et ajoutez le chemin exact de la clé :
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./config/service-account.json
```

Redémarrez ensuite le backend pour prendre en compte la nouvelle clé (par exemple avec pm2 ou docker) :
```bash
# Si vous utilisez pm2
pm2 restart pipolink-backend

# Si vous utilisez docker-compose
docker compose restart api
```

---

## 3. Comprendre l'architecture mise en place

### Backend (Serveur Hono)
- **`firebase-admin`** a été installé.
- **`server/src/app/services/fcm.service.ts`** gère l'envoi de messages de type `MulticastMessage`.
- **`server/src/modules/websocket/handlers/message.handler.ts`** appelle le service FCM automatiquement si le destinataire n'est pas connecté au WebSocket.
- La route **`POST /devices/fcm-token`** enregistre le token FCM de l'appareil mobile dans la base de données (modèle `Device`).

### Frontend (Application Mobile Expo)
L'application passe de `expo-notifications` aux plugins officiels **React Native Firebase**.
- **`app/src/features/notifications/push.ts`** gère les autorisations Android 13+ et écoute les messages en arrière-plan via `messaging().setBackgroundMessageHandler()`.
- Une chaîne de notification (Notification Channel) `pipolink` est configurée par défaut.

> **Important** : Comme FCM utilise du code natif, ces changements nécessitent un nouveau build de production ou de développement complet via EAS (`eas build`). Expo Go standard ne supportera pas les notifications en arrière-plan.
