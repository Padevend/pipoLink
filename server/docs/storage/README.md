# Stockage de fichiers

## Politique appliquée

Le serveur ne renvoie plus d'URL directe vers `storage/`, R2, Google Cloud Storage ou Google Drive. Un upload crée une référence opaque, par exemple `storage://r2/documents/...`, qui reste exclusivement en base de données. Le client reçoit une route de l'API et l'API vérifie le droit d'accès à chaque lecture.

| Ressource | URL client | Contrôle d'accès |
| --- | --- | --- |
| Avatar | `GET /files/avatars/:userId` | Utilisateur authentifié |
| Pièce jointe de message | `GET /files/message-attachments/:id` | Membre de la conversation |
| Document de bibliothèque | `GET /files/documents/:id` | Auteur, personnel, ou document public approuvé |
| Pièce jointe IA | `GET /files/ai-attachments/:id` | Propriétaire ou personnel |
| Affiche d'annonce | `GET /files/announcements/:id/poster` | Utilisateur authentifié |
| Aperçu d'annonce | `GET /files/announcements/:id/preview` | Utilisateur authentifié |

Toutes ces routes exigent `Authorization: Bearer <accessToken>` (ou le cookie d'administration). Les fichiers privés envoient `Cache-Control: private, no-store`; une pièce jointe chiffrée est systématiquement téléchargée comme flux binaire, jamais affichée en ligne.

La route historique `GET /download/:documentId` est conservée pour les anciens clients, mais elle est maintenant authentifiée et applique le même contrôle d'accès qu'un document de bibliothèque. Elle ne doit plus être utilisée par un nouveau client.

## Intégration côté client

Préfixer les URLs relatives par l'URL de l'API, puis faire une requête authentifiée. Pour une balise `<img>` qui ne sait pas ajouter l'en-tête Bearer, télécharger d'abord le contenu via `fetch`, créer un `Blob` puis une URL d'objet; ou utiliser le cookie sécurisé sur le même domaine.

```ts
const response = await fetch(`${API_URL}${avatarUrl}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const imageObjectUrl = URL.createObjectURL(await response.blob());
```

Pour une pièce jointe de message, `POST /messaging/:chatId/messages/upload-attachment` renvoie temporairement `data.url`, qui est une référence `storage://…`, pas une URL à afficher. Envoyez-la sans la modifier dans `attachments[].fileUrl` lors de `POST /messaging/:chatId/messages`. Le message créé contient ensuite l'URL de lecture protégée `/files/message-attachments/:id`.

## Variables communes

| Variable | Requise | Rôle |
| --- | --- | --- |
| `STORAGE_SDK_DRIVER` | oui en production | `local`, `r2`, `gcs` ou `google-drive` |
| `STORAGE_PATH` | oui | Répertoire du provider local, par exemple `./storage` |
| `MAX_FILE_SIZE_MB` | oui | Taille maximale appliquée par le serveur |

La politique automatique de l'application est volontairement limitée à trois emplacements :

- bibliothèque académique : Google Drive, puis le stockage local du serveur en secours ;
- avatars, pièces jointes de messages, annonces et fichiers IA : Cloudflare R2, puis le stockage local en secours.

Le provider GCS reste disponible pour une sélection explicite (`driver: "gcs"`) et pour les anciennes références déjà stockées, mais il ne reçoit aucun nouvel upload via la chaîne automatique. Un provider non configuré est ignoré; un échec de tous les providers fait échouer l'upload au lieu de prétendre qu'il a réussi.

## Compatibilité et migration

Les valeurs historiques `/storage/...`, `r2://...`, URL publique R2, URL GCS et URL Drive continuent d'être résolues par le serveur afin de ne pas interrompre le service lors de la mise à jour. Chaque nouvel upload utilise toutefois `storage://<driver>/<key>`. Il n'est pas nécessaire de migrer immédiatement la base; les anciennes valeurs disparaîtront au fil des remplacements de fichiers.

Ne stockez jamais `/files/...` dans `fileUrl` ou `avatarUrl`: ces colonnes doivent contenir la référence interne, et les services de l'application transforment cette référence en route publique autorisée.

Consultez un guide par provider : [local](local.md), [Cloudflare R2](r2.md), [Google Cloud Storage](gcs.md), [Google Drive](google-drive.md).
