# Guide Opérationnel — Publication de Mises à Jour (EAS Update)

Ce guide décrit la procédure exacte pour publier une mise à jour Over-The-Air (OTA) pour PipoLink en utilisant l'infrastructure EAS Update, tout en conservant la logique métier de l'application (gravité et affichage bloquant).

---

## 1. Prérequis

Avant de lancer une mise à jour, assurez-vous de respecter les conditions suivantes :

- **EAS CLI** doit être installé : `npm install -g eas-cli` (version recommandée : `>= 20.5.1`).
- **Authentification Expo** : Vous devez être connecté au compte Expo qui possède le projet. Vérifiez avec la commande :
  ```bash
  eas whoami
  ```
- **Contexte projet** : Positionnez-vous dans le dossier `app/` du repo.

---

## 2. Channels et Environnements

Ce projet (`9e5bd199-b4be-40d1-99d2-f4a7b75301d7`) est configuré dans `eas.json` avec 3 channels de distribution liés aux profils de build :

- **`development`** : Utilisé pour les builds internes de développement.
- **`preview`** : Utilisé pour la recette / staging (tests pré-production).
- **`production`** : Utilisé pour les utilisateurs finaux (App Store / Play Store).

---

## 3. Publier une mise à jour standard (Silencieuse)

Une mise à jour de gravité `low` ou `medium` sera **téléchargée silencieusement en arrière-plan** par les appareils, et appliquée automatiquement lors de leur prochain redémarrage.

**Commande modèle :**
```bash
eas update --branch production --message '{"severity":"medium","version":"1.1.0","changelog":["Nouvelle architecture IA / Recherche (Agent IA, Agent deeliaison)",""]}'
```
*(Modifiez `production` par `preview` pour tester d'abord en staging).*

---

## 4. Publier une mise à jour critique (Bloquante)

Une mise à jour `high` ou `critical` déclenchera un **écran de blocage immédiat** côté client. L'utilisateur devra appuyer sur "Mettre à jour maintenant", ce qui forcera l'installation et le redémarrage à chaud de l'application (`Updates.reloadAsync()`).

**Checklist avant publication critique :**
- [ ] J'ai testé cette update sur la branche `preview`.
- [ ] J'ai vérifié que je n'ai ajouté aucune librairie native (pas de modification de code iOS/Android).
- [ ] Le `runtimeVersion` de mon app en production est compatible avec cette mise à jour.

**Commande exacte :**
```bash
eas update --branch production --message '{"severity":"critical","changelog":["Correctif de sécurité critique (E2EE)","Fix stockage Google Drive (quota service account)", "Brouillons d'input par chat (messagerie + IA)", "Liens cliquables dans les bulles de message", ""]}'
```

---

## 5. Rollout progressif par pourcentage (Safe Deployment)

Pour éviter de casser l'application de tous les utilisateurs d'un coup, vous pouvez déployer une mise à jour sur un pourcentage de l'audience.

1. **Lancer l'update à 10% :**
   ```bash
   eas update --branch production --rollout-percentage 10 --message '{"severity":"medium","version":"1.0.4","changelog":["Nouvelle feature expérimentale"]}'
   ```
2. **Surveiller :** Attendez quelques heures, surveillez Sentry ou votre outil de crashlytics.
3. **Étendre à 100% :** Si aucune régression n'est détectée, republiez la commande **sans** `--rollout-percentage` (ou utilisez le dashboard Expo pour ajuster le rollout).

---

## 6. Rollback (Restauration d'une version précédente)

Si une mise à jour s'avère défectueuse, vous pouvez forcer les utilisateurs à revenir sur une version antérieure stable.

1. **Identifier l'ID de la mise à jour stable :**
   ```bash
   eas update:list --branch production
   ```
   *Notez le `Update Group ID` de la version fonctionnelle (ex: `a1b2c3d4-xxxx-xxxx...`).*

2. **Republier cet update group sur la branche :**
   ```bash
   eas update --branch production --republish a1b2c3d4-xxxx-xxxx...
   ```
   *(EAS créera une nouvelle mise à jour contenant exactement les mêmes fichiers que la version précédente, annulant ainsi la version défectueuse).*

---

## 7. Vérification Post-Publication

- **Statut via CLI :** `eas update:list --branch production` affichera la liste des updates.
- **Via le Dashboard Expo :** Rendez-vous sur `https://expo.dev/accounts/[COMPTE]/projects/PipoLink/updates` pour suivre l'adoption de l'update en temps réel.
- **Sur un appareil physique :** Si l'update est silencieuse, fermez (kill) l'application et rouvrez-la. L'update se téléchargera en arrière-plan. Tuez-la à nouveau et rouvrez-la pour appliquer l'update.

---

## 8. PROCÉDURE D'URGENCE (CRASH EN PRODUCTION)

À suivre **uniquement** si la production est totalement cassée et nécessite une intervention immédiate sous pression :

1. `cd app`
2. `eas whoami` *(vérifier que vous êtes bien loggé)*
3. **Option A (Rollback) :** Si vous connaissez l'update fautive, lancez immédiatement :
   `eas update --branch production --republish [ID_UPDATE_STABLE]`
4. **Option B (Hotfix code) :** Si le code est corrigé localement, lancez immédiatement le hotfix en mode "critical" pour forcer le téléchargement chez tout le monde :
   `eas update --branch production --message '{"severity":"critical","version":"X.X.X","changelog":["Hotfix de crash"]}'`

---

## 9. Limitations (Ce qui requiert une vraie soumission Store)

Les éléments suivants **ne peuvent pas** être distribués via EAS Update. Toute modification de ce type requiert de refaire un build complet (`eas build`) et de soumettre les fichiers `.aab` / `.ipa` à Google et Apple :

1. Modification dans les dossiers natifs `/ios` ou `/android`.
2. Installation d'une nouvelle librairie NPM contenant du code natif (C++, Java, Swift, Objective-C).
3. Modification d'icônes, Splash Screens, ou permissions système dans `app.json`.
4. Mise à jour de la version du SDK Expo.
