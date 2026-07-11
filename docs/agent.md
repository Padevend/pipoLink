# AGENT.md — Guide d'implémentation : Récupération Silencieuse de Clé Secrète (PipoLink)

## ⚠️ Préambule — à lire avant toute ligne de code

Ce document est un **guide de workflow**, pas une spécification technique figée. Il décrit les étapes à respecter, dans l'ordre, pour implémenter la récupération silencieuse de clé secrète E2E. **Il ne prescrit pas de librairie ou de primitive cryptographique précise** — c'est à l'agent d'implémentation de les choisir en fonction de ce qui existe déjà dans le code.

### Étape 0 — Obligatoire avant toute implémentation

Avant d'écrire le moindre code, l'agent doit :

1. **Lire intégralement la structure actuelle du projet** (backend Hono/Prisma/PostgreSQL et mobile Expo/React Native) : arborescence des dossiers, modules d'auth existants, helpers de crypto déjà présents, conventions de nommage, structure des services/repositories.
2. **Identifier le mécanisme de hashing de mot de passe déjà en place.** Ce projet utilise **bcrypt** pour l'authentification — pas Argon2. L'agent ne doit **jamais** supposer qu'Argon2id est disponible ou déjà utilisé. Il doit :
   - Vérifier si une librairie de KDF (key derivation function) est déjà importée quelque part dans le projet (client ou serveur).
   - Si aucune n'existe, **proposer une solution compatible avec l'environnement Expo/React Native réel** (contraintes natives, taille de bundle, disponibilité des modules natifs), en expliquant le choix avant de l'implémenter — ne pas assumer qu'un module fonctionne sans vérifier sa compatibilité RN/Expo (beaucoup de libs crypto Node ne tournent pas telles quelles en environnement mobile).
   - **Ne jamais réutiliser le hash bcrypt de l'authentification comme clé de chiffrement.** bcrypt est un hash à sens unique conçu pour la vérification, pas pour dériver une clé symétrique réutilisable — sa sortie n'est pas conçue pour ça. Le mot de passe en clair (disponible côté client au moment de la saisie) doit être dérivé séparément via un KDF dédié, indépendamment de la vérification d'auth par bcrypt côté serveur.
   - Documenter clairement, dans le code et dans un commentaire de commit/PR, la raison du choix technique retenu et sa compatibilité avec le reste de la stack.
3. **Ne rien casser de l'existant.** Le flow d'authentification actuel (login, bcrypt, JWT/session) reste inchangé. Ce guide ajoute une couche de dérivation de clé de chiffrement **en parallèle**, jamais en remplacement.
4. Si un doute existe sur la compatibilité d'une approche avec la stack en place, l'agent doit s'arrêter et signaler le point d'incertitude plutôt que de forcer une implémentation qui casse la cohérence du code.

---

## 1. Correction terminologique — important

Deux notions **distinctes** sont en jeu, à ne jamais confondre dans le code, les noms de variables, les routes API ou la documentation :

| Terme | Définition | Statut dans ce document |
|---|---|---|
| **Récupération de mot de passe** ("password recovery") | Flow standard : email + OTP + formulaire de réinitialisation + reconnexion. Mécanisme classique déjà normal sur tout système d'authentification. | **Hors périmètre** — ne pas y toucher, ne pas le documenter ici. |
| **Récupération de clé secrète** ("key recovery") | Récupération du blob de clé privée de chiffrement E2E lorsqu'aucun appareil actif ne peut la transmettre. Spécifique au chiffrement de PipoLink. | **Objet de ce document.** |

Toute variable, route, table ou nom de fonction doit refléter cette distinction : par exemple `keyRecoveryMode`, `/keys/recovery`, `KeyBackup`, jamais `passwordRecovery` pour désigner ce mécanisme.

Les deux chemins possibles, reformulés correctement :

- **Cas A — au moins un appareil actif** → QR linking uniquement, jamais de key recovery.
- **Cas B — aucun appareil actif** → key recovery silencieuse (dérivation locale d'une clé de chiffrement à partir du mot de passe, pour déchiffrer le blob de clé privée stocké côté serveur).

---

## 2. Table d'audit — utiliser `AuditLog` existante

Ne pas créer de nouvelle table `SecurityEvent`. Le projet dispose déjà de :

```prisma
model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  user_id   String   @db.Uuid
  action    String
  targetId  String?
  ip        String?
  userAgent String?
  location  String?
  createdAt DateTime @default(now()) @db.Timestamptz

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("audit_logs")
}
```

### Valeurs attendues pour le champ `action`

(à respecter comme convention — adapter à la casse/style déjà utilisé ailleurs dans le projet pour les autres valeurs de `action`)

- `device_linked` — nouvel appareil associé via QR (`targetId` = id du nouveau `Device`)
- `device_revoked` — appareil retiré, manuellement ou automatiquement (`targetId` = id du `Device` révoqué)
- `key_recovery_triggered` — récupération de clé secrète initiée avec succès (`targetId` = id du nouveau `Device` créé suite à la récupération)
- `key_recovery_failed_attempt` — tentative de déchiffrement du blob échouée (`targetId` = null ou id utilisateur, selon convention existante)

**Étape à respecter** : avant de coder, vérifier comment `action` est déjà rempli ailleurs dans le projet (snake_case ? camelCase ? préfixé par domaine ?) et suivre exactement la même convention plutôt que d'introduire un nouveau style.

---

## 3. Renforcement du mot de passe (zxcvbn)

### Règles définitives à implémenter

- **Longueur minimale conservée à 8 caractères** (pas de changement de règle de longueur).
- Règles de composition existantes conservées (majuscule, minuscule, symbole).
- **Ajout d'une vérification d'entropie réelle via zxcvbn**, en complément des règles de composition — pas en remplacement.
- Un mot de passe qui respecte les règles de composition mais obtient un score zxcvbn faible (score 0 ou 1 sur l'échelle 0-4) doit être **rejeté côté frontend mobile**, avant tout envoi au serveur.

### Workflow de validation côté mobile

1. À chaque frappe (ou au blur du champ), calculer le score zxcvbn en local.
2. Si les règles de composition (8+, majuscule, minuscule, symbole) ne sont pas respectées → afficher le message d'erreur existant actuel (ne pas le modifier, juste vérifier qu'il reste cohérent).
3. Si les règles de composition sont respectées **mais que le score zxcvbn est insuffisant** → afficher un message dédié, distinct du message de composition, par exemple : *"Ce mot de passe est trop facile à deviner, essayez une combinaison moins courante."*
4. Le formulaire ne doit permettre la soumission que si **les deux conditions** sont réunies : composition valide ET score zxcvbn suffisant.
5. **Vérifier également côté serveur** (ne jamais faire confiance uniquement à une validation client) — le serveur doit rejeter toute inscription/changement de mot de passe qui ne satisferait pas la même règle, en recalculant le score côté backend si une librairie zxcvbn (ou équivalente) existe pour Node ; sinon signaler ce manque et proposer l'ajout du package correspondant.

### Point d'adaptation à la stack

Avant d'ajouter zxcvbn, vérifier :
- Si une librairie de validation de mot de passe existe déjà dans le projet mobile (souvent couplée au formulaire d'inscription) — l'étendre plutôt que dupliquer une nouvelle validation en parallèle.
- La taille du bundle ajoutée par zxcvbn (~800KB non compressé) est acceptable pour une app Expo — vérifier si une variante avec dictionnaires personnalisés plus légers serait préférable dans ce contexte mobile.

---

## 4. Workflow complet — Cas A (QR linking, appareil actif existant)

1. Connexion classique sur le nouvel appareil (email + password → JWT via bcrypt, flow existant inchangé).
2. Le serveur vérifie l'existence d'au moins un `Device` actif (`revokedAt IS NULL`) pour cet utilisateur.
3. Si un appareil actif existe → le serveur répond avec un indicateur explicite (`keyRecoveryMode: 'qr_required'`).
4. **Renforcement demandé** : si la connexion réussit mais qu'aucune clé de déchiffrement locale n'est détectée sur le nouvel appareil, redirection **automatique et immédiate**, sans action de l'utilisateur, vers l'écran "Associer un appareil" avec QR code.
5. Un appareil déjà actif scanne le QR, vérifie le quota du plan (2 pour Free, 4 pour Premium) avant d'accepter.
6. Si le quota est respecté : chiffrement de la clé privée pour le nouvel appareil, transmission via le canal existant (WebSocket déjà en place pour la messagerie — réutiliser ce canpal plutôt que d'en créer un nouveau si l'infrastructure Socket.IO le permet).
7. Création de l'entrée `Device`, log `AuditLog` avec `action: 'device_linked'`.
8. Notification email (voir §6) et notification WebSocket aux autres appareils actifs.

---

## 5. Workflow complet — Cas B (Key recovery silencieuse, aucun appareil actif)

1. Connexion classique (email + password, flow bcrypt inchangé).
2. Le serveur détecte l'absence totale d'appareils actifs → répond avec `keyRecoveryMode: 'key_recovery'`.
3. **Côté client uniquement, jamais transmis au serveur** :
   - Dérivation d'une clé de chiffrement à partir du mot de passe en clair (déjà disponible côté client au moment de la saisie), via le KDF choisi à l'Étape 0.
   - Récupération du blob `KeyBackup` (clé privée chiffrée + salt) depuis le serveur.
   - Déchiffrement local du blob.
4. **Contrainte impérative : le processus doit être entièrement silencieux.** Aucune étape intermédiaire visible pour l'utilisateur au-delà d'un loader générique neutre (type "Configuration en cours..."). Pas de formulaire supplémentaire, pas de saisie de PIN distinct, pas d'étape de confirmation manuelle — le mot de passe déjà saisi au login suffit à déclencher toute la chaîne.
5. Une fois le déchiffrement réussi :
   - Enregistrement du nouvel appareil comme `Device` actif.
   - Révocation de tous les autres `Device` existants pour cet utilisateur (`revokedAt = now()`), même si en théorie aucun n'était actif — nettoyage défensif systématique.
   - Log `AuditLog` avec `action: 'key_recovery_triggered'`.
   - **Mise à jour fluide de l'interface** : transition douce vers l'état "connecté avec clé chargée", pas de rechargement brutal de l'écran, une fois la clé disponible en mémoire.
6. En cas d'échec de déchiffrement (mauvais résultat, mot de passe changé entre-temps, etc.) : décrémenter `attemptsRemaining` sur `KeyBackup`, logguer `key_recovery_failed_attempt`, et au-delà d'un seuil (à définir en cohérence avec les pratiques déjà en place dans le projet pour d'autres compteurs de tentatives, ex. login) bloquer temporairement avec message clair invitant à contacter le support.
7. Rate-limiting serveur sur cet endpoint, indépendant du compteur `attemptsRemaining` (protection contre le brute-force distribué).

---


## 6. Notifications de sécurité

### Email (systématique pour `device_linked` et `key_recovery_triggered`)

Contenu obligatoire :
- Nom de l'appareil
- Localisation approximative (résolue via IP)
- Adresse IP
- Date et heure
- Action effectuée, formulée clairement (ex. "Nouvel appareil associé", "Récupération de clé de chiffrement effectuée")
- Note de sécurité, formulée ainsi ou équivalent :

> *"Si cette action n'est pas de votre initiative, veuillez immédiatement retirer cet appareil et contacter notre support."*

Vérifier si un système d'envoi d'email transactionnel existe déjà dans le projet (probable, vu le flow de récupération de mot de passe classique déjà en place) et le réutiliser plutôt que d'en introduire un nouveau.

### WebSocket — révocation en temps réel

1. Sur retrait manuel ou révocation automatique (Cas B) : `UPDATE Device SET revokedAt = now()`.
2. Émission d'un événement (réutiliser le canal Socket.IO déjà utilisé pour la messagerie si l'architecture le permet) vers l'appareil ciblé : `device:revoked`.
3. **Si l'appareil ciblé est connecté au moment de l'émission** → déclenchement immédiat du processus de déconnexion **même si l'app est ouverte et activement utilisée** — pas d'attente du prochain refresh.
4. **Si l'appareil ciblé n'est pas connecté** → vérification obligatoire du statut `Device.revokedAt` à chaque reconnexion WebSocket et à chaque appel API sensible, en garde-fou.
5. Côté client, à réception de `device:revoked` : purge immédiate du stockage sécurisé (clé privée, tokens), fermeture de la session WebSocket, redirection forcée vers le login avec message explicite.

---

## 7. Checklist de validation avant mise en production

- [ ] L'agent a lu la structure existante avant d'écrire du code (pas d'implémentation à l'aveugle).
- [ ] Aucune confusion entre "récupération de mot de passe" et "récupération de clé secrète" dans le code, les noms de routes, les logs.
- [ ] `AuditLog` est utilisée, aucune nouvelle table de log créée.
- [ ] bcrypt reste utilisé pour l'auth, aucune substitution par un autre hash pour cet usage.
- [ ] La dérivation de clé de chiffrement est **indépendante** du hash bcrypt d'auth.
- [ ] zxcvbn (ou équivalent) est vérifié à la fois côté mobile et côté serveur.
- [ ] Longueur minimale du mot de passe reste à 8 caractères.
- [ ] Le flow de key recovery ne demande aucune saisie supplémentaire à l'utilisateur au-delà du password déjà tapé au login.
- [ ] Le loader de récupération est générique, sans détail technique visible.
- [ ] La mise à jour de l'interface post-récupération est fluide, sans reload brutal.
- [ ] Notification email envoyée à chaque `device_linked` et `key_recovery_triggered`.
- [ ] Notification WebSocket immédiate à chaque révocation, avec déconnexion forcée même si l'app était ouverte.
- [ ] Quota d'appareils (2 Free / 4 Premium) vérifié côté serveur avant tout linking.
