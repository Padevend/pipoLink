# Provider Google Drive

Google Drive est conservé pour les bibliothèques déjà organisées dans Drive. Contrairement à l'ancienne implémentation, le driver ne crée plus de permission `anyone/reader`: les fichiers restent privés et l'API les lit avec le compte OAuth configuré.

```dotenv
STORAGE_SDK_DRIVER=google-drive
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_REDIRECT_URI=https://<api-domain>/oauth/callback
GOOGLE_REFRESH_TOKEN=<offline-refresh-token>
GOOGLE_DRIVE_FOLDER_ID=<fallback-folder-id>

# Facultatifs : classement par catégorie; sinon GOOGLE_DRIVE_FOLDER_ID est utilisé
GOOGLE_DRIVE_AVATARS_FOLDER_ID=<folder-id>
GOOGLE_DRIVE_DOCUMENTS_FOLDER_ID=<folder-id>
GOOGLE_DRIVE_MESSAGE_ATTACHMENTS_FOLDER_ID=<folder-id>
GOOGLE_DRIVE_ANNOUNCEMENTS_FOLDER_ID=<folder-id>
GOOGLE_DRIVE_AI_FOLDER_ID=<folder-id>
```

1. Créez un client OAuth de type **Web application** dans [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials), activez l'API Google Drive et ajoutez l'URI de redirection exact.
2. Effectuez une autorisation OAuth avec l'accès hors ligne afin d'obtenir un refresh token. Le compte autorisé doit avoir accès en écriture aux dossiers choisis.
3. Copiez l'ID visible dans l'URL de chaque dossier Drive et renseignez les variables correspondantes.
4. Mettez le client secret et le refresh token dans `APPLICATION_ENV_JSON`, jamais dans `.env.example` ni Git.

Le [guide d'autorisation OAuth 2.0 de Google](https://developers.google.com/identity/protocols/oauth2) décrit l'obtention et le renouvellement de jetons. Un refresh token permet au backend de récupérer des access tokens sans rendre les documents publics.

Drive est moins adapté que R2/GCS à un trafic binaire important; gardez-le surtout pour les documents existants ou de petite taille. Le driver utilise les IDs de dossier configurés par catégorie, pas les chaînes `avatars` ou `documents` comme IDs Drive.
