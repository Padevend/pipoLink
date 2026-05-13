# PipoLink — Agent de mise en place du chiffrement E2E
> Spécification complète du workflow de gestion des clés cryptographiques.
> Périmètre : backend (`backend/`) + app mobile (`app/`).
> L'agent ne réécrit pas tout — il implémente le workflow manquant et corrige
> le code existant uniquement quand la sécurité l'exige.
> Version : 1.0.0 — Mai 2026

---

## Règle fondamentale de sécurité

```
LA CLÉ PRIVÉE NE QUITTE JAMAIS L'APPAREIL.

Le backend ne voit jamais, ne stocke jamais, ne reçoit jamais une clé privée.
Le backend stocke uniquement les clés PUBLIQUES.
Tout chiffrement/déchiffrement avec la clé privée se fait exclusivement
dans l'application mobile (app/), dans le module shared/crypto/.
```

---

## Table des matières

1. [Vue d'ensemble du système](#1-vue-densemble-du-système)
2. [Schéma de chiffrement](#2-schéma-de-chiffrement)
3. [Primitives cryptographiques](#3-primitives-cryptographiques)
4. [Workflow 1 — Création de compte & génération des clés](#4-workflow-1--création-de-compte--génération-des-clés)
5. [Workflow 2 — Login & détection d'onboarding manquant](#5-workflow-2--login--détection-donboarding-manquant)
6. [Workflow 3 — Création d'un chat (groupe ou privé)](#6-workflow-3--création-dun-chat-groupe-ou-privé)
7. [Workflow 4 — Ajout d'un membre à un chat](#7-workflow-4--ajout-dun-membre-à-un-chat)
8. [Workflow 5 — Envoi d'un message chiffré](#8-workflow-5--envoi-dun-message-chiffré)
9. [Workflow 6 — Réception et déchiffrement d'un message](#9-workflow-6--réception-et-déchiffrement-dun-message)
10. [Workflow 7 — Ajout d'un appareil (QR Code)](#10-workflow-7--ajout-dun-appareil-qr-code)
11. [Workflow 8 — Rotation des clés](#11-workflow-8--rotation-des-clés)
12. [Workflow 9 — Clé manquante ou corrompue](#12-workflow-9--clé-manquante-ou-corrompue)
13. [Restructuration du modèle Chat](#13-restructuration-du-modèle-chat)
14. [Modifications backend requises](#14-modifications-backend-requises)
15. [Modifications app mobile requises](#15-modifications-app-mobile-requises)
16. [Schéma Prisma — diff complet](#16-schéma-prisma--diff-complet)
17. [Sécurité — règles et interdits](#17-sécurité--règles-et-interdits)
18. [Checklist d'implémentation](#18-checklist-dimplémentation)

---

## 1. Vue d'ensemble du système

### Acteurs et rôles

```
Appareil (app mobile)
  └── Détient : clé privée (jamais exportée)
  └── Détient : clé AES de chaque chat dont l'user est membre
               (stockée chiffrée avec sa propre clé publique dans la BDD)

Backend
  └── Stocke : clés publiques de chaque appareil
  └── Stocke : clé AES de chaque chat chiffrée par appareil
               (opaque pour le backend — il ne peut pas la déchiffrer)
  └── Stocke : messages chiffrés (opaque pour le backend)
```

### Résumé des algorithmes

| Usage | Algorithme |
|---|---|
| Paire de clés identité appareil | X25519 (ECDH) via `expo-crypto` + `tweetnacl` |
| Chiffrement clé AES de chat | RSA-OAEP 2048 bits ou X25519 + HKDF |
| Chiffrement des messages | AES-256-GCM (clé de chat) |
| Chiffrement des documents | AES-256-GCM (même clé de chat) |
| Signature des clés publiques | Ed25519 |
| Stockage clé privée appareil | `expo-secure-store` (enclave matérielle si dispo) |
| Stockage clé AES chat | `expo-secure-store` + copie chiffrée en BDD |

---

## 2. Schéma de chiffrement

```
┌──────────────────────────────────────────────────────────────────┐
│                        APPAREIL ALICE                            │
│                                                                  │
│  [clé privée Alice_A] ← jamais exportée                         │
│  [clé publique Alice_A] → envoyée au backend à l'onboarding     │
│                                                                  │
│  Pour lire un message dans Chat X :                             │
│    1. Récupère encrypted_chat_key[Chat X][Alice_A] du backend   │
│    2. Déchiffre avec [clé privée Alice_A] → chat_key_AES        │
│    3. Déchiffre le message avec chat_key_AES                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                           BACKEND                                │
│                                                                  │
│  Stocke :                                                        │
│    devices.public_key        = clé publique Alice_A (base64)    │
│    chat_member_keys.enc_key  = AES_chat chiffrée avec pub_Alice │
│    messages.cipher_text      = message chiffré AES-GCM          │
│    messages.iv               = vecteur initialisation           │
│                                                                  │
│  Ne stocke PAS :                                                 │
│    - clé privée                                                  │
│    - clé AES en clair                                           │
│    - contenu des messages en clair                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Primitives cryptographiques

### Côté app mobile — `shared/crypto/`

#### `keys.ts` — Génération et gestion des clés d'identité

```ts
/**
 * Génère une paire de clés X25519 pour l'appareil courant.
 *
 * - Utilise `tweetnacl` (nacl.box.keyPair) pour X25519
 * - La clé privée est stockée immédiatement dans SecureStore
 * - La clé publique est retournée en base64 pour envoi au backend
 * - Une signature Ed25519 de la clé publique est générée pour authenticité
 *
 * @returns { publicKey: string (base64), signature: string (base64) }
 *
 * SÉCURITÉ : cette fonction ne doit être appelée QU'UNE SEULE FOIS par appareil.
 * Si des clés existent déjà dans SecureStore → les retourner sans régénérer.
 */
export async function generateIdentityKeys(): Promise<{
  publicKey: string;
  signature: string;
}>

/**
 * Récupère la clé publique de l'appareil depuis SecureStore.
 * Si absente → lancer le workflow de récupération (voir Workflow 9).
 */
export async function getPublicKey(): Promise<string | null>

/**
 * Récupère la clé privée de l'appareil depuis SecureStore.
 * NE JAMAIS retourner cette valeur à une couche réseau ou à un log.
 *
 * SÉCURITÉ : usage restreint à shared/crypto/ uniquement.
 * Ne pas exporter cette fonction depuis l'index du module.
 */
async function _getPrivateKey(): Promise<Uint8Array | null>
```

#### `chat-key.ts` — Gestion des clés AES de chat

```ts
/**
 * Génère une clé AES-256 aléatoire pour un nouveau chat.
 * Retourne les bytes bruts (Uint8Array 32 bytes).
 * N'est JAMAIS stockée en clair — chiffrée immédiatement après.
 */
export function generateChatKey(): Uint8Array

/**
 * Chiffre la clé AES du chat avec la clé publique X25519 d'un appareil.
 * Utilise NaCl box (X25519 + XSalsa20-Poly1305).
 *
 * @param chatKey      - Clé AES brute (Uint8Array 32 bytes)
 * @param devicePubKey - Clé publique X25519 du device cible (base64)
 * @returns              Clé chiffrée en base64 (à stocker en BDD)
 *
 * SÉCURITÉ : chatKey est effacé de la mémoire après chiffrement.
 */
export async function encryptChatKeyForDevice(
  chatKey: Uint8Array,
  devicePubKey: string
): Promise<string>

/**
 * Déchiffre la clé AES du chat avec la clé privée de l'appareil courant.
 *
 * @param encryptedChatKey - Clé chiffrée (base64) récupérée du backend
 * @returns                  Clé AES brute (Uint8Array) ou null si échec
 *
 * SÉCURITÉ : clé privée récupérée et utilisée localement, jamais loggée.
 */
export async function decryptChatKey(
  encryptedChatKey: string
): Promise<Uint8Array | null>

/**
 * Stocke localement la clé AES d'un chat dans SecureStore.
 * Clé SecureStore : `chat_key_${chatId}`
 *
 * Appelé après un décryptage réussi pour éviter de re-décrypter à chaque message.
 */
export async function cacheChatKey(chatId: string, key: Uint8Array): Promise<void>

/**
 * Récupère la clé AES d'un chat depuis le cache SecureStore local.
 * Si absente → décrypter depuis le backend (getEncryptedChatKey).
 */
export async function getCachedChatKey(chatId: string): Promise<Uint8Array | null>
```

#### `message.ts` — Chiffrement/déchiffrement des messages

```ts
/**
 * Chiffre un message texte avec la clé AES-256-GCM du chat.
 *
 * @param plaintext - Message en clair
 * @param chatKey   - Clé AES (Uint8Array 32 bytes)
 * @returns { cipherText: string, iv: string } (base64)
 */
export function encryptMessage(
  plaintext: string,
  chatKey: Uint8Array
): { cipherText: string; iv: string }

/**
 * Déchiffre un message avec la clé AES-256-GCM du chat.
 *
 * @param cipherText - Message chiffré (base64)
 * @param iv         - Vecteur d'initialisation (base64)
 * @param chatKey    - Clé AES (Uint8Array 32 bytes)
 * @returns Texte déchiffré ou null si échec (clé invalide, données corrompues)
 */
export function decryptMessage(
  cipherText: string,
  iv: string,
  chatKey: Uint8Array
): string | null
```

#### `document.ts` — Chiffrement des fichiers

```ts
/**
 * Chiffre un fichier (Buffer) avec la clé AES du chat.
 * Même algorithme AES-256-GCM que les messages.
 *
 * @param fileBuffer - Contenu brut du fichier
 * @param chatKey    - Clé AES du chat
 * @returns { encryptedBuffer: Uint8Array, iv: string }
 */
export function encryptFile(
  fileBuffer: Uint8Array,
  chatKey: Uint8Array
): { encryptedBuffer: Uint8Array; iv: string }

/**
 * Déchiffre un fichier reçu du backend.
 */
export function decryptFile(
  encryptedBuffer: Uint8Array,
  iv: string,
  chatKey: Uint8Array
): Uint8Array | null
```

#### `device-sync.ts` — Synchronisation multi-appareils

```ts
/**
 * Exporte le bundle de clés de l'appareil courant pour synchronisation.
 * Contient : clé publique + signature + liste des chatIds dont on est membre.
 * NE CONTIENT PAS la clé privée.
 *
 * Utilisé lors de l'ajout d'un nouvel appareil via QR Code.
 */
export async function exportDeviceBundle(): Promise<DeviceBundle>

/**
 * Importe et valide le bundle d'un appareil existant lors d'un QR link.
 * Vérifie la signature Ed25519 avant d'accepter les clés.
 */
export async function importAndValidateBundle(bundle: DeviceBundle): Promise<boolean>
```

---

## 4. Workflow 1 — Création de compte & génération des clés

### Séquence complète

```
ÉTAPE 1 : register (email + password)
  App → POST /auth/register
  Backend → crée User (is_active=false, is_configured=false)
  Backend → génère OTP, envoie email
  App → affiche écran OTP

ÉTAPE 2 : vérification OTP
  App → POST /auth/verify-otp
  Backend → active le compte (is_active=true)
  Backend → génère accessToken + refreshToken
  Backend → répond { tokens, user, requiresOnboarding: true }
  App → reçoit les tokens, les stocke dans SecureStore
  App → détecte requiresOnboarding=true → redirige vers l'écran Onboarding

ÉTAPE 3 : onboarding (complétion du profil + génération des clés)
  ┌──────────────────────────────────────────────────────────────┐
  │  C'est ICI que les clés cryptographiques sont générées.     │
  │  Jamais avant, jamais après.                                │
  └──────────────────────────────────────────────────────────────┘

  3a. L'app génère la paire de clés d'identité :
      const { publicKey, signature } = await generateIdentityKeys()
      → clé privée stockée dans SecureStore('identity_private_key')
      → clé publique gardée en mémoire pour l'étape 3b

  3b. L'app soumet le formulaire d'onboarding :
      POST /users/me/onboarding
      Body : {
        firstname, lastname, username, phone, niveau, filiere,
        deviceName: "iPhone 14 Pro",
        devicePlatform: "ios",
        deviceFingerprint: "<uuid>",
        devicePublicKey: publicKey,      ← clé publique UNIQUEMENT
        deviceKeySignature: signature,   ← preuve d'authenticité
      }

  3c. Backend reçoit et traite :
      → Crée / met à jour UserProfile
      → Crée Device {
          user_id, name, platform, fingerprint,
          public_key, key_signature,
          isPrimary: true
        }
      → Met is_configured=true sur User
      → Répond { success: true, user, device }

  3d. App reçoit la confirmation :
      → Stocke deviceId dans SecureStore
      → Redirige vers l'écran principal (tabs)
```

### Backend — `modules/auth/auth-service.ts`

```ts
/**
 * MODIFIER la méthode verifyOtp() pour :
 *   - Ajouter dans la réponse : requiresOnboarding: !user.is_configured
 *   - Ne PAS créer de Device à ce stade (reporté à l'onboarding)
 */

/**
 * MODIFIER generateTokens() pour inclure dans le payload JWT :
 *   - is_configured: boolean
 * Permet au middleware de détecter rapidement si l'onboarding est requis.
 */
```

### Backend — `modules/users/user-service.ts`

```ts
/**
 * CRÉER la méthode completeOnboarding() :
 *
 * @param userId  - ID utilisateur
 * @param payload - { ...profileFields, deviceName, devicePlatform,
 *                    deviceFingerprint, devicePublicKey, deviceKeySignature }
 *
 * Transactions Prisma (atomique) :
 *   1. Upsert UserProfile avec les champs profil
 *   2. Create Device {
 *        user_id: userId,
 *        name: payload.deviceName,
 *        platform: payload.devicePlatform,
 *        fingerprint: payload.deviceFingerprint,
 *        public_key: payload.devicePublicKey,
 *        key_signature: payload.deviceKeySignature,
 *        isPrimary: true,
 *      }
 *   3. Update User { is_configured: true }
 *
 * VALIDATION SÉCURITÉ avant de persister :
 *   - Vérifier que devicePublicKey est bien une clé X25519 valide (32 bytes en base64)
 *   - Vérifier la signature Ed25519 de la clé publique
 *   - Rejeter si un Device avec ce fingerprint existe déjà pour un autre user
 */
```

### Middleware `onboarding-required.ts`

```ts
/**
 * CRÉER ce middleware.
 * Placé après authMiddleware sur toutes les routes nécessitant is_configured=true.
 *
 * Si is_configured=false dans le token JWT :
 *   → 403 { error: 'ONBOARDING_REQUIRED', message: 'Complétez votre profil pour continuer.' }
 *
 * Routes exemptées (ne nécessitent pas is_configured) :
 *   POST /users/me/onboarding
 *   POST /auth/refresh
 *   POST /auth/logout
 */
```

---

## 5. Workflow 2 — Login & détection d'onboarding manquant

```
App → POST /auth/login { email, password, deviceFingerprint }

Backend :
  1. Vérifie les credentials
  2. Vérifie is_active
  3. Vérifie si un Device existe pour ce fingerprint
     → Si oui : attache deviceId au token
     → Si non et is_configured=true : créer un Device temporaire (sans clé)
       et signaler au frontend (requiresKeySetup: true)
     → Si non et is_configured=false : token normal, requiresOnboarding: true
  4. Génère tokens avec { is_configured, requiresKeySetup } dans le payload

App reçoit la réponse :
  - requiresOnboarding=true   → redirect /onboarding
  - requiresKeySetup=true     → redirect /key-setup (régénération de clé pour ce device)
  - sinon                     → redirect /tabs (accueil)
```

### Backend — modification de `login()` dans `auth-service.ts`

```ts
/**
 * MODIFIER login() :
 *
 * Paramètre supplémentaire : deviceFingerprint (optionnel dans le body)
 *
 * Logique ajoutée :
 *   const device = await prisma.device.findFirst({
 *     where: { user_id: user.id, fingerprint: payload.deviceFingerprint, revokedAt: null }
 *   })
 *
 *   if (!device && user.is_configured) {
 *     // Appareil non reconnu sur un compte configuré
 *     // Ne pas bloquer, mais signaler au frontend
 *     flags.requiresKeySetup = true
 *   }
 *
 *   Inclure dans la réponse :
 *   {
 *     tokens,
 *     user,
 *     requiresOnboarding: !user.is_configured,
 *     requiresKeySetup: flags.requiresKeySetup ?? false,
 *   }
 */
```

---

## 6. Workflow 3 — Création d'un chat (groupe ou privé)

### Principe

```
À la création d'un chat :
  1. Le créateur (admin) génère la clé AES du chat (côté app uniquement)
  2. Il chiffre cette clé AES avec la clé publique de CHAQUE device de CHAQUE membre
  3. Il envoie au backend : { chatInfo, members, encryptedKeys: { deviceId: encKey }[] }
  4. Le backend stocke tout sans jamais voir la clé AES en clair
```

### Séquence app mobile

```ts
/**
 * features/messaging/hooks/use-create-chat.ts
 *
 * Étapes :
 *
 * 1. Récupérer les clés publiques de tous les devices des membres cibles
 *    GET /users/:userId/devices/public-keys
 *    Réponse : [{ deviceId, publicKey }] pour chaque user
 *
 * 2. Générer la clé AES du chat
 *    const chatKey = generateChatKey()   // Uint8Array 32 bytes
 *
 * 3. Chiffrer chatKey pour chaque device de chaque membre
 *    (y compris TOUS les devices du créateur lui-même)
 *    const encryptedKeys = await Promise.all(
 *      allDevices.map(async ({ deviceId, publicKey }) => ({
 *        deviceId,
 *        encryptedKey: await encryptChatKeyForDevice(chatKey, publicKey)
 *      }))
 *    )
 *
 * 4. Effacer chatKey de la mémoire immédiatement après
 *    chatKey.fill(0)
 *
 * 5. Envoyer au backend
 *    POST /chats {
 *      name,               // pour groupe = nom choisi ; pour privé = null
 *      type,               // 'group' | 'private'
 *      memberUserIds,      // [userId1, userId2, ...]
 *      encryptedKeys,      // [{ deviceId, encryptedKey }]
 *    }
 *
 * 6. Backend répond avec le chat créé
 *    L'app stocke localement : await cacheChatKey(chatId, chatKey)
 *    (avant effacement)
 */
```

### Backend — `modules/messaging/messaging-service.ts`

```ts
/**
 * CRÉER createChat() :
 *
 * @param creatorId    - ID du créateur
 * @param payload      - { name, type, memberUserIds, encryptedKeys }
 *
 * Transaction Prisma atomique :
 *
 * 1. Créer Chat {
 *      created_by: creatorId,
 *      type: payload.type,
 *      name: payload.name ?? null,
 *    }
 *
 * 2. Pour chaque membre (y compris le créateur) :
 *    Créer ChatMember {
 *      chat_id: chat.id,
 *      user_id: memberId,
 *      role: memberId === creatorId ? 'admin' : 'member',
 *    }
 *
 * 3. Pour chaque entrée dans payload.encryptedKeys :
 *    Créer ChatMemberKey {
 *      chat_id: chat.id,
 *      device_id: deviceId,
 *      encrypted_chat_key: encryptedKey,   ← opaque pour le backend
 *    }
 *
 * VALIDATION :
 *   - Vérifier que chaque deviceId dans encryptedKeys appartient bien
 *     à un des memberUserIds (sécurité : pas d'injection de device tiers)
 *   - Vérifier que tous les devices de chaque membre ont une entrée dans encryptedKeys
 *     (sinon le membre ne pourra pas lire les messages sur ses autres appareils)
 *   - Type 'private' : exactement 2 membres, max
 */
```

---

## 7. Workflow 4 — Ajout d'un membre à un chat

```
Seul un admin du chat peut ajouter un membre.

Séquence app mobile (côté admin) :

1. L'admin récupère la clé AES du chat depuis son cache local
   const chatKey = await getCachedChatKey(chatId)
   // Si absent du cache → décrypter depuis le backend (voir Workflow 9)

2. Récupérer les devices du nouveau membre
   GET /users/:newUserId/devices/public-keys

3. Chiffrer chatKey pour chaque device du nouveau membre
   const newEncryptedKeys = await Promise.all(
     newUserDevices.map(async ({ deviceId, publicKey }) => ({
       deviceId,
       encryptedKey: await encryptChatKeyForDevice(chatKey, publicKey)
     }))
   )

4. Envoyer au backend
   POST /chats/:chatId/members {
     userId: newUserId,
     encryptedKeys: newEncryptedKeys,
   }

5. Effacer chatKey de la mémoire
   chatKey.fill(0)

Backend — addMember() dans messaging-service.ts :
  1. Vérifier que le demandeur est admin du chat
  2. Créer ChatMember { chat_id, user_id, role: 'member' }
  3. Créer ChatMemberKey pour chaque device du nouveau membre
  4. Émettre WS event 'chat.member_added' vers les membres existants
```

---

## 8. Workflow 5 — Envoi d'un message chiffré

```
Séquence app mobile :

1. Récupérer la clé AES du chat
   let chatKey = await getCachedChatKey(chatId)
   if (!chatKey) {
     // Pas en cache → récupérer la clé chiffrée du backend et décrypter
     const encKey = await api.getEncryptedChatKey(chatId, deviceId)
     chatKey = await decryptChatKey(encKey)
     await cacheChatKey(chatId, chatKey)
   }

2. Chiffrer le message
   const { cipherText, iv } = encryptMessage(plaintext, chatKey)

3. Si documents joints :
   for (const file of attachments) {
     const { encryptedBuffer, iv: fileIv } = encryptFile(file.buffer, chatKey)
     // Upload le fichier chiffré → POST /messages/upload-attachment
     // Stocker : fileUrl, fileIv, fileName, fileSize, mimeType
   }

4. Envoyer le message
   POST /chats/:chatId/messages {
     cipherText,
     iv,
     type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'MIXED',
     attachments: [{ fileUrl, iv, fileName, fileSize, mimeType }]
   }

Backend — sendMessage() :
  - Valider l'appartenance de l'expéditeur au chat
  - Stocker Message { chat_id, sender_id, cipherText, iv, type, status: 'sent' }
  - Stocker MessageAttachment pour chaque fichier joint
  - Émettre WS 'message.created' vers les membres du chat
  - NE PAS tenter de lire le contenu — le backend est aveugle
```

---

## 9. Workflow 6 — Réception et déchiffrement d'un message

```
App mobile (réception) :

Sur événement WS 'message.created' ou au chargement de la liste :

1. Récupérer la clé AES du chat (cache ou backend)
   const chatKey = await getCachedChatKey(chatId)
               ?? await fetchAndDecryptChatKey(chatId, deviceId)

2. Déchiffrer le message
   const plaintext = decryptMessage(message.cipherText, message.iv, chatKey)
   if (!plaintext) {
     // Afficher : "Message illisible — clé manquante ou corrompue"
     // Déclencher Workflow 9 (récupération de clé)
   }

3. Pour les documents joints :
   // Télécharger le fichier chiffré depuis fileUrl
   const encryptedBuffer = await downloadFile(attachment.fileUrl)
   const fileBuffer = decryptFile(encryptedBuffer, attachment.iv, chatKey)

4. Tout déchiffrement se fait IN-MEMORY — ne jamais persister le plaintext
   Seul le cipherText est stocké dans le cache local SQLite
```

---

## 10. Workflow 7 — Ajout d'un appareil (QR Code)

### Vue d'ensemble

```
Ce mécanisme permet à un nouvel appareil d'accéder aux mêmes chats
sans que la clé privée de l'appareil principal ne soit transmise.

Principe :
  - Chaque appareil a SA propre paire de clés
  - L'appareil principal redistribue les clés AES des chats au nouvel appareil
    en les chiffrant avec la clé publique du nouvel appareil
```

### Séquence détaillée

```
PHASE 1 — Initiation sur le NOUVEL appareil

  1. L'utilisateur choisit "Ajouter cet appareil"
  2. Le nouvel appareil génère sa propre paire de clés X25519
     const { publicKey, signature } = await generateIdentityKeys()
  3. Il génère un QR token côté serveur
     POST /auth/qr/generate → { token, expiresAt }
  4. Il encode dans le QR code :
     { token, publicKey, signature, deviceName, platform, fingerprint }
  5. Il affiche le QR code à scanner

PHASE 2 — Scan sur l'APPAREIL PRINCIPAL

  6. L'appareil principal scanne le QR code
  7. Il vérifie la signature Ed25519 de la clé publique du nouvel appareil
     const valid = verifyKeySignature(publicKey, signature)
     if (!valid) → afficher erreur "QR Code invalide"
  8. Il récupère la liste de TOUS les chats dont l'utilisateur est membre
     GET /chats?memberId=me → [{ chatId, ... }]
  9. Pour chaque chat, il récupère la clé AES et la rechiffre
     pour le nouvel appareil
     for (const chat of chats) {
       const chatKey = await getCachedChatKey(chat.id)
                    ?? await fetchAndDecryptChatKey(chat.id, currentDeviceId)
       const encForNewDevice = await encryptChatKeyForDevice(chatKey, newDevicePublicKey)
       chatKeyBundle.push({ chatId: chat.id, encryptedKey: encForNewDevice })
     }
  10. Il envoie au backend
      POST /auth/qr/verify {
        token,
        newDevice: { publicKey, signature, deviceName, platform, fingerprint },
        chatKeyBundle,   ← clés AES rechiffrées pour le nouvel appareil
      }

PHASE 3 — Backend traite la liaison

  11. Vérifie le token QR (validité, non-utilisé)
  12. Vérifie la signature Ed25519 de la clé publique reçue
  13. Crée le Device pour le nouvel appareil
  14. Crée les ChatMemberKey pour chaque chat dans chatKeyBundle
  15. Génère les tokens JWT pour le nouvel appareil
  16. Émet WS 'device.linked' vers l'appareil principal
  17. Répond avec les tokens via le canal WebSocket ou polling du nouvel appareil

PHASE 4 — Le nouvel appareil reçoit ses tokens

  18. Stocke l'access token + refresh token dans SecureStore
  19. Stocke sa clé privée (déjà générée en PHASE 1, step 2)
  20. Récupère les messages récents (ils sont déjà chiffrés pour lui en BDD)
  21. À la lecture : déchiffre chaque clé AES de chat avec SA clé privée
```

---

## 11. Workflow 8 — Rotation des clés

### Quand déclencher une rotation

```
Automatique (cron backend toutes les 24h) :
  - Clé d'un device expirée (device.keyExpiresAt < now())
  - Rotation planifiée (device.keyCreatedAt > 90 jours)

Manuel (action utilisateur) :
  - "Régénérer mes clés" dans les paramètres de sécurité
  - Après révocation d'un appareil
  - Après suspicion de compromission
```

### Séquence de rotation

```
1. Backend détecte qu'une rotation est nécessaire
   → Émet WS 'key.rotation_required' vers l'appareil concerné

2. L'app reçoit l'événement
   → Génère une nouvelle paire X25519
   const { publicKey: newPubKey, signature } = await rotateIdentityKeys()
   // Stocke la nouvelle clé privée dans SecureStore (écrase l'ancienne)

3. Pour chaque chat dont l'user est membre :
   → Récupère la clé AES (toujours accessible avec l'ancienne clé privée encore en mémoire)
   → Rechiffre avec la nouvelle clé publique
   newChatKeyBundle.push({ chatId, encryptedKey })

4. Envoie au backend
   POST /devices/:deviceId/rotate-keys {
     newPublicKey,
     keySignature: signature,
     chatKeyBundle: newChatKeyBundle,
   }

5. Backend :
   → Met à jour Device { public_key, key_signature, keyCreatedAt: now() }
   → Met à jour ChatMemberKey pour chaque chat avec les nouvelles versions chiffrées
   → Invalide le refresh token actuel → force re-login

6. L'ancienne clé privée est effacée de SecureStore
   await SecureStore.deleteItemAsync('identity_private_key_backup')
```

### Backend — `modules/devices/device-service.ts`

```ts
/**
 * CRÉER rotateDeviceKey() :
 *
 * @param userId   - ID de l'utilisateur
 * @param deviceId - ID de l'appareil
 * @param payload  - { newPublicKey, keySignature, chatKeyBundle }
 *
 * VALIDATION :
 *   - Vérifier la signature Ed25519 de newPublicKey
 *   - Vérifier que deviceId appartient à userId
 *   - Vérifier que le chatKeyBundle couvre TOUS les chats dont l'user est membre
 *     (sinon certains chats deviendraient illisibles)
 *
 * Transaction Prisma :
 *   1. Update Device { public_key, key_signature, keyCreatedAt: now() }
 *   2. Pour chaque entry dans chatKeyBundle :
 *      Update ChatMemberKey { encrypted_chat_key } WHERE chat_id + device_id
 *   3. Révoquer le refresh token actuel (forcer re-login)
 *   4. Log AuditLog { action: 'KEY_ROTATED' }
 */
```

---

## 12. Workflow 9 — Clé manquante ou corrompue

### Cas possibles

```
A. SecureStore vide (réinstallation app, reset appareil)
   → La clé privée est perdue → irréversible
   → Comportement : proposer à l'utilisateur de "Configurer cet appareil"
     via le QR Code de l'appareil principal (Workflow 7)

B. Cache SecureStore corrompu (clé AES d'un chat absente)
   → Récupérer la clé chiffrée depuis le backend et re-décrypter
   → GET /chats/:chatId/my-encrypted-key?deviceId=:deviceId

C. Clé publique en BDD non trouvée pour un device
   → Le device est peut-être révoqué
   → Afficher "Appareil non autorisé, contactez l'administrateur"
```

### Séquence — Cas A (perte totale de clé privée)

```ts
/**
 * features/encryption/hooks/use-key-recovery.ts
 *
 * 1. Détecter au démarrage : SecureStore.getItemAsync('identity_private_key') === null
 *    et que Device.public_key existe en BDD pour ce fingerprint
 *    → flag: keyLost = true
 *
 * 2. Afficher un écran d'alerte :
 *    "Vos clés cryptographiques sont introuvables sur cet appareil.
 *     Pour raisons de sécurité, elles ne peuvent pas être récupérées à distance.
 *     Scannez le QR Code depuis votre autre appareil pour reconfigurer celui-ci."
 *
 * 3. Bouton "Reconfigurer via QR Code" → lance Workflow 7 (rôle : nouvel appareil)
 *    → L'appareil principal redistribue toutes les clés AES des chats
 *
 * 4. Si aucun autre appareil disponible :
 *    "Aucun autre appareil configuré. Vous ne pouvez pas récupérer vos messages.
 *     Vous pouvez supprimer votre compte et en créer un nouveau."
 *    → Afficher bouton "Supprimer le compte"
 *
 * SÉCURITÉ : Ne jamais proposer de "récupération par email" ou "réinitialisation"
 * qui implique l'envoi d'une clé privée — c'est une porte dérobée.
 */
```

### Séquence — Cas B (cache AES absent pour un chat)

```ts
/**
 * shared/crypto/chat-key.ts — fetchAndDecryptChatKey()
 *
 * 1. GET /chats/:chatId/my-encrypted-key?deviceId=:deviceId
 *    Réponse : { encryptedChatKey: string }
 *
 * 2. const chatKey = await decryptChatKey(encryptedChatKey)
 *    if (!chatKey) → Cas A (clé privée perdue)
 *
 * 3. await cacheChatKey(chatId, chatKey)
 *
 * 4. return chatKey
 */
```

---

## 13. Restructuration du modèle Chat

### Problème actuel

```
Le modèle Chat actuel ne distingue pas correctement :
  - Les échanges privés (2 personnes)
  - Les groupes (N personnes, avec nom visible de tous)

Pour un échange privé, le "nom" visible dépend de l'utilisateur qui regarde.
```

### Nouveau comportement

```
Chat.type = 'private' :
  - Chat.name = null en base (pas de nom partagé)
  - Côté app : le nom visible = nom de l'AUTRE membre
    → Calculé côté frontend : members.find(m => m.userId !== currentUserId).displayName

Chat.type = 'group' :
  - Chat.name = nom choisi par le créateur (stocké en BDD)
  - Visible identiquement pour tous les membres
```

### Endpoint — liste des chats

```ts
/**
 * GET /chats
 *
 * Le backend retourne dans ChatMember l'objet user avec displayName calculé.
 * L'app utilise la logique suivante pour afficher le nom :
 *
 * function getChatDisplayName(chat, currentUserId) {
 *   if (chat.type === 'group') return chat.name
 *   const other = chat.members.find(m => m.userId !== currentUserId)
 *   return other?.user?.displayName ?? 'Utilisateur inconnu'
 * }
 *
 * NB : le backend ne fait pas ce calcul — il retourne les données brutes.
 * Le frontend est responsable de l'affichage conditionnel.
 */
```

---

## 14. Modifications backend requises

### Nouveaux endpoints

```
POST   /users/me/onboarding
         Body : { ...profileFields, deviceName, devicePlatform,
                  deviceFingerprint, devicePublicKey, deviceKeySignature }

GET    /users/:userId/devices/public-keys
         Réponse : [{ deviceId, publicKey }]
         Auth : tout utilisateur connecté peut récupérer les clés publiques
                (nécessaire pour chiffrer des clés de chat pour un autre user)

POST   /chats
         Body : { name, type, memberUserIds, encryptedKeys }

POST   /chats/:chatId/members
         Body : { userId, encryptedKeys: [{ deviceId, encryptedKey }] }

GET    /chats/:chatId/my-encrypted-key?deviceId=:id
         Réponse : { encryptedChatKey }
         Auth : l'appelant doit être membre du chat

POST   /devices/:deviceId/rotate-keys
         Body : { newPublicKey, keySignature, chatKeyBundle }

POST   /chats/:chatId/messages/upload-attachment
         Multipart : fichier chiffré + iv + metadata
```

### Modification du modèle `auth-service.ts`

```ts
/**
 * verifyOtp() → ajouter requiresOnboarding dans la réponse
 * login()     → ajouter deviceFingerprint dans le body, requiresKeySetup dans la réponse
 * generateTokens() → ajouter is_configured dans le payload JWT
 */
```

### Nouveau middleware à créer

```ts
/**
 * app/middlewares/onboarding-required.middleware.ts
 * app/middlewares/configured-device.middleware.ts
 *   → Vérifie que le device appelant est enregistré et non révoqué
 *   → Ajoute c.set('deviceId', ...) au contexte
 */
```

---

## 15. Modifications app mobile requises

### Fichiers à créer

```
shared/crypto/
  ├── keys.ts           (generateIdentityKeys, getPublicKey, _getPrivateKey)
  ├── chat-key.ts       (generateChatKey, encryptChatKeyForDevice, decryptChatKey,
  │                      cacheChatKey, getCachedChatKey, fetchAndDecryptChatKey)
  ├── message.ts        (encryptMessage, decryptMessage)
  ├── document.ts       (encryptFile, decryptFile)
  ├── device-sync.ts    (exportDeviceBundle, importAndValidateBundle)
  └── index.ts          (exports publics — NE PAS exporter _getPrivateKey)

features/auth/
  ├── hooks/use-onboarding.ts     (complète le profil + génère les clés)
  └── hooks/use-key-recovery.ts   (détecte perte de clé + QR recovery)

features/messaging/
  ├── hooks/use-create-chat.ts    (génère clé AES, chiffre pour chaque device)
  ├── hooks/use-add-member.ts     (rechiffre clé pour nouveau membre)
  ├── hooks/use-send-message.ts   (chiffre message avant envoi)
  └── hooks/use-decrypt-messages.ts (déchiffre à la réception)

features/devices/
  └── hooks/use-link-device.ts    (QR scan + redistribution des clés AES)
```

### Modifications des hooks existants

```ts
/**
 * use-send-message.ts EXISTANT :
 *   → Ajouter le chiffrement avant l'appel API
 *   → Ajouter le support des attachments chiffrés

 * use-messages.ts EXISTANT :
 *   → Déchiffrer les messages après chargement (au lieu de les afficher tels quels)

 * use-link-device.ts EXISTANT :
 *   → Ajouter la phase de redistribution des clés AES (step 9 du Workflow 7)
 */
```

### Stockage SecureStore — clés utilisées

```
'identity_private_key'       → clé privée X25519 de l'appareil (Uint8Array base64)
'identity_public_key'        → clé publique X25519 (copie locale)
'device_id'                  → ID du device en base
'chat_key_<chatId>'          → clé AES du chat X (Uint8Array base64)
```

---

## 16. Schéma Prisma — diff complet

### Tables à modifier

```prisma
// ── Device — ajouter champs crypto ───────────────────────────────────────────
model Device {
  // ... champs existants ...
  public_key      String?    // Clé publique X25519 (base64) — fournie à l'onboarding
  key_signature   String?    // Signature Ed25519 de la clé publique
  keyCreatedAt    DateTime?  @db.Timestamptz // Date de la dernière rotation
  keyExpiresAt    DateTime?  @db.Timestamptz // Date d'expiration (90 jours)
  // ...
}
```

```prisma
// ── ChatMemberKey — NOUVELLE TABLE ───────────────────────────────────────────
// Stocke la clé AES du chat chiffrée par device
// Le backend ne peut pas déchiffrer encrypted_chat_key
model ChatMemberKey {
  id                 String   @id @db.Uuid @default(uuid())
  chat_id            String   @db.Uuid
  device_id          String   @db.Uuid
  encrypted_chat_key String   // Clé AES du chat chiffrée avec pub_key du device
  created_at         DateTime @db.Timestamptz @default(now())
  updated_at         DateTime @db.Timestamptz @updatedAt

  device Device @relation(fields: [device_id], references: [id], onDelete: Cascade)

  @@unique([chat_id, device_id])
  @@index([chat_id])
  @@index([device_id])
  @@map("chat_member_keys")
}
```

```prisma
// ── Chat — modifier ChatMember pour retirer encrypted_chat_key ───────────────
// encrypted_chat_key est maintenant dans ChatMemberKey (par device, pas par user)
model ChatMember {
  chat_id   String         @db.Uuid
  user_id   String         @db.Uuid
  role      ChatMemberRole @default(member)
  joined_at DateTime       @db.Timestamptz

  // SUPPRIMER : encrypted_chat_key String  ← déplacé dans ChatMemberKey

  chat Chat @relation(fields: [chat_id], references: [id])
  user User @relation(fields: [user_id], references: [id])

  @@id([chat_id, user_id])
  @@index([chat_id])
  @@index([user_id])
}
```

```prisma
// ── Message — ajouter support attachments ────────────────────────────────────
model Message {
  // ... champs existants (cipherText, iv, status, ...) ...
  type MessageType @default(TEXT)  // TEXT | IMAGE | DOCUMENT | MIXED | SYSTEM

  attachments MessageAttachment[]
}

// NOUVELLE TABLE
model MessageAttachment {
  id          String   @id @db.Uuid @default(uuid())
  message_id  String   @db.Uuid
  file_url    String   // URL du fichier chiffré en storage
  iv          String   // IV AES-GCM du fichier (base64)
  file_name   String   // Nom original du fichier
  file_size   Int      // Taille en bytes
  mime_type   String   // Type MIME
  created_at  DateTime @db.Timestamptz @default(now())

  message Message @relation(fields: [message_id], references: [id], onDelete: Cascade)

  @@index([message_id])
  @@map("message_attachments")
}
```

```prisma
// ── User — ajouter AuditAction KEY_ROTATED ───────────────────────────────────
enum AuditAction {
  // ... valeurs existantes ...
  KEY_ROTATED
  KEY_RECOVERY_INITIATED
}
```

---

## 17. Sécurité — règles et interdits

### Règles absolues

```
✗  La clé privée ne quitte JAMAIS l'appareil
   → Aucun endpoint backend ne doit accepter ou demander une clé privée
   → Logger une alerte si un payload entrant contient 'privateKey'

✗  La clé AES d'un chat n'est jamais stockée en clair en BDD
   → encrypted_chat_key est opaque pour le backend
   → Aucun log ne doit contenir une valeur de clé

✗  Pas de "récupération par email" pour les clés privées
   → C'est une porte dérobée — si la clé est perdue, elle est perdue

✗  Pas de copie de la clé privée dans AsyncStorage (non sécurisé)
   → Uniquement SecureStore (enclave matérielle)

✓  Vérifier la signature Ed25519 de toute clé publique reçue
   → Avant de l'utiliser pour chiffrer une clé de chat

✓  Effacer les clés AES de la mémoire après usage (fill(0))

✓  Vérifier que le chatKeyBundle couvre tous les devices d'un membre
   avant d'accepter un addMember ou un createChat

✓  Journaliser (AuditLog) toute rotation de clé et tout ajout de device

✓  Expiration des clés : keyExpiresAt = keyCreatedAt + 90 jours
   Le cron de rotation vérifie quotidiennement
```

---

## 18. Checklist d'implémentation

### Backend

- [ ] Modifier `User` Prisma : champ `is_configured` existant, vérifier
- [ ] Modifier `Device` Prisma : `public_key`, `key_signature`, `keyCreatedAt`, `keyExpiresAt`
- [ ] Créer `ChatMemberKey` Prisma
- [ ] Modifier `ChatMember` Prisma : retirer `encrypted_chat_key`
- [ ] Créer `MessageAttachment` Prisma
- [ ] Ajouter `KEY_ROTATED`, `KEY_RECOVERY_INITIATED` à `AuditAction`
- [ ] Migration Prisma
- [ ] `auth-service.ts` : `verifyOtp()` → `requiresOnboarding`, `login()` → `requiresKeySetup`
- [ ] `auth-service.ts` : `verifyQrToken()` → accepter et stocker `chatKeyBundle`
- [ ] `user-service.ts` : `completeOnboarding()` → créer Device avec clé publique
- [ ] `device-service.ts` : `rotateDeviceKey()` → rotation atomique
- [ ] `messaging-service.ts` : `createChat()` → stocker `ChatMemberKey` par device
- [ ] `messaging-service.ts` : `addMember()` → stocker `ChatMemberKey` pour nouvel appareil
- [ ] Middleware `onboarding-required.ts`
- [ ] Middleware `configured-device.ts`
- [ ] Endpoint `GET /users/:userId/devices/public-keys`
- [ ] Endpoint `GET /chats/:chatId/my-encrypted-key`
- [ ] Endpoint `POST /devices/:deviceId/rotate-keys`
- [ ] Endpoint `POST /chats/:chatId/messages/upload-attachment`
- [ ] Cron `key-rotation.job.ts` (expiration + rotation planifiée)

### App mobile

- [ ] `shared/crypto/keys.ts` : `generateIdentityKeys`, `getPublicKey`, `_getPrivateKey`
- [ ] `shared/crypto/chat-key.ts` : toutes les fonctions listées
- [ ] `shared/crypto/message.ts` : `encryptMessage`, `decryptMessage`
- [ ] `shared/crypto/document.ts` : `encryptFile`, `decryptFile`
- [ ] `shared/crypto/device-sync.ts` : `exportDeviceBundle`, `importAndValidateBundle`
- [ ] `shared/crypto/index.ts` : exports publics sans `_getPrivateKey`
- [ ] `features/auth/hooks/use-onboarding.ts` : génère clés + soumet profil + clé publique
- [ ] `features/auth/hooks/use-key-recovery.ts` : détection perte + QR recovery
- [ ] `features/messaging/hooks/use-create-chat.ts` : génère AES + chiffre pour chaque device
- [ ] `features/messaging/hooks/use-add-member.ts` : rechiffre AES pour nouveau membre
- [ ] `features/messaging/hooks/use-send-message.ts` : chiffre message + attachments
- [ ] `features/messaging/hooks/use-decrypt-messages.ts` : déchiffre à la réception
- [ ] `features/devices/hooks/use-link-device.ts` : QR + redistribution AES
- [ ] Écran `app/auth/onboarding.tsx` : déclenche `use-onboarding`
- [ ] Écran `app/devices/key-recovery.tsx` : affiche les options de récupération
- [ ] Détection au démarrage (`processes/app-startup`) : vérifier présence clé privée