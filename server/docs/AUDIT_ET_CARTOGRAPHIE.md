# Audit et cartographie — serveur PipoLink

Audit réalisé sur le dépôt serveur au moment de cette mise à jour.

## Architecture observée

| Domaine | Composants principaux | État constaté |
| --- | --- | --- |
| API | Hono, routes `start/routes`, contrôleurs `app/controllers`, services métier | Architecture en couches claire; endpoints REST et WebSocket coexistent. |
| Base de données | PostgreSQL/Aurora, Prisma 7, schéma `prisma/schema.prisma` | Migrations Prisma disponibles et désormais attendues dans Git. |
| Fichiers | `FileService` → `StorageService` → Google Drive/R2/local (GCS optionnel) | Abstraction présente mais l'ancienne URL publique rendait l'accès fragile et non uniforme. |
| Temps réel | WebSocket avec Redis optionnel | Événements envoyés lors des messages, annonces et documents. |
| Conteneur | Docker multi-stage, PM2 cluster | Image compilée; healthcheck et exécution explicite des migrations ajoutés au flux CI/CD. |
| Production ciblée | EC2 + Aurora + Secrets Manager | Workflows remplacent l'ancien modèle ECS non configuré par ECR + SSM adapté à EC2. |

## Flux de fichiers après correction

```text
upload -> FileService (validation / traitement) -> StorageService -> provider privé
       -> référence storage://driver/key en base

client -> GET /files/<ressource>/<id> + JWT -> ACL métier -> provider -> contenu binaire
```

Les ACL sont reliées à la ressource et non à une URL supposée privée : appartenance au chat pour les pièces jointes, propriétaire/personnel/publication pour les documents, utilisateur authentifié pour avatars et annonces.

## Problèmes identifiés et corrigés

| Gravité | Observation précédente | Correction livrée |
| --- | --- | --- |
| Critique | `/download/:id` ne traitait que `Document`, était public et mettait un cache public. | Route historique authentifiée; routes `/files/...` spécialisées et ACL par ressource; cache privé. |
| Critique | Les uploads retournaient URL locale ou cloud; Drive créait une permission publique `anyone/reader`. | Références opaques, aucune URL de provider retournée, permission Drive publique supprimée. |
| Haute | Driver déduit à partir de parsing d'URL dispersé, avec fallback local sur une URL inconnue. | Résolution centralisée et stricte avec compatibilité seulement pour les formats historiques connus. |
| Haute | Les clés de fichiers étaient prévisibles et le nom original pouvait influencer le chemin. | Noms UUID générés côté serveur, validation de clé/path traversal dans le driver local. |
| Haute | `subDir` était traité comme ID de dossier par Google Drive, donc `avatars`/`documents` ne fonctionnaient pas sans hasard. | Mapping explicite des catégories vers `GOOGLE_DRIVE_*_FOLDER_ID`. |
| Moyenne | Les suppressions provider pouvaient échouer silencieusement; la déduplication supprimait potentiellement un fichier encore référencé. | Erreurs provider propagées; suppression physique seulement si aucune autre ligne `Document` ne référence le même fichier. |
| Moyenne | Ingestion RAG effectuait parfois un `fetch` d'URL externe. | Elle relit maintenant exclusivement par le `StorageService`. |
| Haute | Workflow existant visait ECS avec valeurs factices, alors que la cible est EC2. | CI, synchronisation Secrets Manager et déploiement ECR/SSM/Prisma ajoutés. |

## Points à surveiller

- Il n'existe pas encore de suite de tests automatisés dans le dépôt. La CI valide donc compilation, génération Prisma et construction Docker; ajouter des tests d'autorisation des routes `/files` est la prochaine priorité.
- Les fichiers sont actuellement lus en mémoire (`Buffer`). Pour des fichiers très grands ou un streaming vidéo, faire évoluer l'interface des drivers vers un `ReadableStream` et gérer `Range`.
- Les anciens fichiers restent lisibles grâce à la compatibilité des références. Programmez une migration asynchrone vers le provider cible avant de supprimer le volume local ou les anciens buckets.
- La chaîne de fallback est maintenant déterministe : Drive → local pour la bibliothèque, R2 → local pour tous les assets applicatifs. GCS n'est pas choisi automatiquement.
- Une EC2 unique n'offre pas de haute disponibilité. R2/GCS puis un groupe Auto Scaling/ECS constituent l'évolution naturelle sans modifier les URLs client.
