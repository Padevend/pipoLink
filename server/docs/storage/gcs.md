# Provider Google Cloud Storage

```dotenv
STORAGE_SDK_DRIVER=gcs
GCS_BUCKET_NAME=pipolink-production
GCS_PROJECT_ID=<google-cloud-project-id>
# Une des deux options d'authentification ci-dessous :
GCS_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# GCS_KEY_FILE_PATH=/run/secrets/gcs-service-account.json
```

`GCS_SERVICE_ACCOUNT_JSON` doit être un JSON sur une seule ligne dans le secret AWS. C'est l'option la plus simple avec le conteneur EC2. `GCS_KEY_FILE_PATH` est utile seulement si vous montez déjà un fichier de clé dans le conteneur; ne le mettez pas dans Git.

1. Créez un bucket privé dans [Cloud Storage](https://console.cloud.google.com/storage/browser).
2. Créez un compte de service avec les droits minimaux sur ce bucket (lecture, création et suppression d'objets).
3. Créez une clé JSON uniquement si une identité fédérée n'est pas possible, compactez-la sur une ligne et stockez-la dans AWS Secrets Manager via le workflow.

La documentation Google décrit l'[authentification Cloud Storage](https://cloud.google.com/storage/docs/authentication) et la [création/révocation des clés de compte de service](https://cloud.google.com/iam/docs/keys-create-delete). Google recommande la fédération d'identité pour les charges exécutées hors de Google Cloud; privilégiez-la dès que l'organisation peut la configurer. Le bucket doit rester privé car PipoLink le sert via `/files/...`.
