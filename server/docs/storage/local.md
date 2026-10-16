# Provider local

Le provider `local` écrit sur le volume local dans `STORAGE_PATH/<catégorie>/<nom-généré>`. Il est adapté au développement et à une instance unique avec volume persistant; il ne convient pas à plusieurs instances EC2 sans système de fichiers partagé.

```dotenv
STORAGE_SDK_DRIVER=local
STORAGE_PATH=./storage
MAX_FILE_SIZE_MB=50
```

Avec le workflow EC2 fourni, Docker monte le volume nommé `pipolink-storage` sur `/app/storage`; utilisez donc `STORAGE_PATH=/app/storage` dans le secret de production si ce provider est retenu.

Le dossier ne doit pas être exposé par Nginx, CloudFront ou la route statique du serveur. Les fichiers passent exclusivement par `/files/...`.

Pour sauvegarder un volume local avant une migration, arrêtez l'application et copiez le contenu du volume vers un stockage chiffré. Un passage vers R2 ou GCS concerne les nouveaux fichiers; les références locales existantes restent lisibles tant que ce volume est conservé.
