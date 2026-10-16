# Déploiement AWS : EC2, Aurora, Secrets Manager et GitHub Actions

Cette configuration déploie une image Docker immuable dans Amazon ECR, applique les migrations Prisma à Aurora PostgreSQL puis redémarre le conteneur sur EC2 via AWS Systems Manager (SSM). Elle n'utilise ni clé SSH ni clé d'accès AWS longue durée dans GitHub.

```text
GitHub Actions --OIDC--> IAM role --push--> ECR
      |                                  |
      +--SSM Run Command--> EC2 <--pull--+
                              |
                 Secrets Manager (JSON) + Aurora PostgreSQL
```

Le déploiement correspond à une instance EC2 existante et une grappe Aurora PostgreSQL existante. Les ressources réseau (VPC, sous-réseaux, Security Groups, Aurora) restent une décision d'infrastructure explicite, afin de ne pas risquer une création coûteuse ou exposée par erreur. Les workflows automatisent ensuite l'image, les secrets et les migrations de schéma.

Les workflows sont :

- `ci.yml` : à chaque PR et push sur `main`, installe les dépendances verrouillées, génère Prisma, compile TypeScript et construit l'image Docker.
- `sync-aws-secret.yml` : à déclencher manuellement après un changement de secret; crée ou met à jour le secret JSON dans Secrets Manager.
- `deploy-production.yml` : à chaque push sur `main` (ou manuellement), pousse l'image dans ECR, récupère le secret sur EC2, exécute `prisma migrate deploy`, démarre le conteneur et vérifie `/health`.

## 1. Préparer AWS une seule fois

### ECR

Créez un dépôt privé, par exemple `pipolink-backend`, dans la même région que l'EC2 : [console ECR](https://console.aws.amazon.com/ecr/home#/repositories). Activez le scan à la publication et une politique de cycle de vie pour conserver par exemple les 30 dernières images taguées SHA.

### EC2 et accès SSM

L'instance doit :

1. avoir le rôle géré `AmazonSSMManagedInstanceCore` et apparaître dans [Systems Manager > Fleet Manager](https://console.aws.amazon.com/systems-manager/managed-instances);
2. avoir Docker, AWS CLI v2, `jq` et `curl` installés;
3. avoir un rôle EC2 autorisé à lire **un seul** secret et à tirer les images du dépôt ECR;
4. ne pas exposer le port PostgreSQL à Internet. Aurora doit n'accepter que le Security Group de l'EC2.

Exemple de préparation pour Amazon Linux 2023 (à exécuter une fois avec un administrateur) :

```bash
sudo dnf install -y docker jq curl awscli
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```

Sur Ubuntu, installez les paquets équivalents avec `apt`. Vérifiez ensuite que le SSM Agent est en ligne; SSM Run Command permet d'exécuter la procédure à distance sur le nœud géré, comme documenté par AWS dans [Run Command](https://docs.aws.amazon.com/systems-manager/latest/userguide/run-command.html).

Ajoutez au rôle EC2 la politique gérée SSM ci-dessus, puis une politique minimale semblable à celle-ci. Remplacez région, compte, dépôt et nom/ARN de secret :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PullPipoLinkImage",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ReadOnlyApplicationSecret",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:pipolink/production-*"
    }
  ]
}
```

Si le secret utilise une clé KMS gérée par le client, ajoutez aussi `kms:Decrypt` sur cette seule clé. AWS indique les permissions `secretsmanager:GetSecretValue` et, le cas échéant, `kms:Decrypt` dans la [référence `get-secret-value`](https://docs.aws.amazon.com/cli/latest/reference/secretsmanager/get-secret-value.html).

### Aurora PostgreSQL

Dans [RDS](https://console.aws.amazon.com/rds/home#databases:), conservez Aurora dans des sous-réseaux privés, activez la sauvegarde automatique et configurez au moins un alarmage CloudWatch sur l'espace, les connexions et le CPU. Créez un utilisateur de migration/app avec le minimum de droits requis par Prisma, et utilisez son URL dans `DATABASE_URL`.

Le workflow applique uniquement les migrations déjà versionnées par `prisma migrate deploy`. Il ne lance jamais `prisma migrate dev`, `db push` ou une suppression de base en production. Ajoutez chaque migration à une PR, faites-la valider par CI puis fusionnez-la.

Pour TLS Aurora, encodez l'autorité de certification en base64 dans `DATABASE_CA_CERT_BASE64`; ne passez pas un chemin local d'ordinateur. Exemple de préparation locale :

```bash
base64 -w 0 global-bundle.pem
```

Sur macOS, utilisez `base64 < global-bundle.pem | tr -d '\n'`. Placez le résultat dans le JSON de secret. L'application refuse désormais de démarrer en production sans certificat CA, ce qui évite une régression TLS silencieuse.

## 2. Configurer l'identité GitHub OIDC

1. Dans IAM, ajoutez le provider `https://token.actions.githubusercontent.com` avec l'audience `sts.amazonaws.com` : [guide GitHub OIDC pour AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).
2. Créez le rôle `PipoLinkGitHubDeployRole` avec une relation de confiance limitée au dépôt et à l'environnement GitHub `production` :

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"},
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"},
      "StringLike": {"token.actions.githubusercontent.com:sub": "repo:OWNER/REPOSITORY:environment:production"}
    }
  }]
}
```

3. Attachez au rôle GitHub les permissions de push ECR, `ssm:SendCommand`, `ssm:GetCommandInvocation`, et `secretsmanager:CreateSecret`, `UpdateSecret`, `DescribeSecret` limités au dépôt, à l'instance et au secret PipoLink. L'action GitHub demande un jeton OIDC éphémère (`id-token: write`); aucun `AWS_ACCESS_KEY_ID` ou `AWS_SECRET_ACCESS_KEY` GitHub n'est nécessaire.
4. Dans **Settings > Environments**, créez l'environnement `production` et ajoutez une règle d'approbation pour les mainteneurs. Les deux workflows sensibles utilisent cet environnement.

## 3. Variables GitHub et secret d'application

Dans **Settings > Secrets and variables > Actions**, créez les **variables** suivantes (elles ne contiennent pas de secret) :

| Variable GitHub | Exemple | Utilisée par |
| --- | --- | --- |
| `AWS_REGION` | `eu-west-3` | secrets + déploiement |
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::123456789012:role/PipoLinkGitHubDeployRole` | secrets + déploiement |
| `ECR_REPOSITORY` | `pipolink-backend` | déploiement |
| `EC2_INSTANCE_ID` | `i-0123456789abcdef0` | déploiement SSM |
| `AWS_APPLICATION_SECRET_ID` | `pipolink/production/app` | secrets + déploiement |
| `APP_PORT` | `2654` | déploiement, facultative |

Ajoutez ensuite le **secret GitHub** `APPLICATION_ENV_JSON` avec le contenu du modèle [application-env.example.json](application-env.example.json), complété avec les vraies valeurs. Il doit être un objet JSON valide, sans commentaires. Chaque valeur doit être sur une seule ligne; encodez les PEM en base64 et minifiez les JSON de compte de service GCS.

Exécutez **Actions > Synchronise le secret d'environnement AWS > Run workflow**. Le workflow valide le JSON, crée le secret s'il n'existe pas ou le met à jour. Le contenu n'est pas affiché dans les logs. AWS documente la création d'un secret et le stockage du contenu dans [`SecretString`](https://docs.aws.amazon.com/cli/latest/reference/secretsmanager/create-secret.html).

## 4. Premier déploiement et exploitation

1. Vérifiez que le secret est synchronisé et que l'EC2 est `Online` dans SSM.
2. Fusionnez dans `main`, ou lancez **Déployer la production sur EC2** manuellement.
3. Le workflow publie l'image sous le SHA Git et `main`, applique les migrations puis attend la réponse de `http://127.0.0.1:PORT/health` directement sur l'EC2.
4. Placez un ALB ou un reverse proxy HTTPS devant l'EC2; il doit joindre le port `APP_PORT`, tandis que le Security Group de l'EC2 n'accepte ce port que depuis l'ALB.

Pour revenir à une image connue, lancez le workflow manuellement avec son `image_tag` SHA et décochez `run_migrations` seulement si la migration est réellement rétrocompatible. Une migration Prisma n'est pas automatiquement réversible : prévoyez un script de rollback et une sauvegarde Aurora avant une migration destructive.

Le script de déploiement monte le volume Docker `pipolink-storage` pour la compatibilité avec le provider `local`. Pour une architecture multi-instance, choisissez R2 ou GCS : un volume local ne se partage pas entre EC2. L'image, les secrets centralisés et SSM restent identiques; pour un vrai autoscaling, ciblez ensuite un Auto Scaling Group/Launch Template ou migrez le même conteneur vers ECS. Ne prétendez pas qu'une seule EC2 est haute disponibilité.
