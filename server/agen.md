# PipoLink Backend — Agent de Build
> Spécification technique complète pour la génération du backend PipoLink.
> Stack : Hono · Prisma · PostgreSQL · VineJS · Nodemailer · Sharp · bcrypt
> Version : 1.0.0 — Mai 2026

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack & dépendances](#2-stack--dépendances)
3. [Structure du projet](#3-structure-du-projet)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Configuration globale](#5-configuration-globale)
6. [Schéma Prisma](#6-schéma-prisma)
7. [Infrastructure partagée](#7-infrastructure-partagée)
8. [Kernel & Bootstrap](#8-kernel--bootstrap)
9. [Module Auth](#9-module-auth)
10. [Module Users](#10-module-users)
11. [Module Devices](#11-module-devices)
12. [Module Messaging](#12-module-messaging)
13. [Module Library](#13-module-library)
14. [Module AI](#14-module-ai)
15. [Module Subscriptions](#15-module-subscriptions)
16. [Module Payments](#16-module-payments)
17. [Module Notifications](#17-module-notifications)
18. [Module Announcements](#18-module-announcements)
19. [Module Updates](#19-module-updates)
20. [Middlewares](#20-middlewares)
21. [Service Mail](#21-service-mail)
22. [Service Fichiers](#22-service-fichiers)
23. [Format des réponses API](#23-format-des-réponses-api)
24. [Conventions & règles absolues](#24-conventions--règles-absolues)
25. [Checklist de génération](#25-checklist-de-génération)

---

## 1. Vue d'ensemble

PipoLink est une plateforme étudiante complète. Le backend expose une API REST
construite avec **Hono**, branchée sur **PostgreSQL** via **Prisma ORM**.

### Principes fondamentaux

```
Route → Controller → Service → Prisma
  ↑          ↑           ↑
Middleware  Validation  Logique métier
            VineJS      isolée ici
```

- **Zéro logique métier dans les controllers** — ils valident et délèguent.
- **Zéro appel Prisma direct dans les controllers** — uniquement dans les services.
- **Zéro duplication** entre services.
- **Toutes les réponses** passent par le helper `ApiResponse`.
- **Toute la documentation du code** est rédigée en français.

---

## 2. Stack & dépendances

```json
{
  "dependencies": {
    "hono": "latest",
    "@hono/node-server": "latest",
    "@prisma/client": "latest",
    "@vinejs/vine": "latest",
    "bcrypt": "latest",
    "nodemailer": "latest",
    "sharp": "latest",
    "luxon": "latest",
    "dotenv": "latest",
    "mime-types": "latest"
  },
  "devDependencies": {
    "prisma": "latest",
    "typescript": "latest",
    "@types/bcrypt": "latest",
    "@types/nodemailer": "latest",
    "@types/luxon": "latest",
    "@types/mime-types": "latest",
    "tsx": "latest"
  }
}
```

> **Important** : Le projet utilise PostgreSQL avec le client Prisma standard
> (pas MariaDB). Supprimer l'adapter MariaDB du `config/database.ts` fourni
> et utiliser `new PrismaClient()` directement.

---

## 3. Structure du projet

```
src/
│
├── app/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── device.controller.ts
│   │   ├── messaging.controller.ts
│   │   ├── library.controller.ts
│   │   ├── folder.controller.ts
│   │   ├── ai.controller.ts
│   │   ├── subscription.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── announcement.controller.ts
│   │   └── updates.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── otp.service.ts
│   │   ├── user.service.ts
│   │   ├── device.service.ts
│   │   ├── messaging.service.ts
│   │   ├── library.service.ts
│   │   ├── folder.service.ts
│   │   ├── ai.service.ts
│   │   ├── subscription.service.ts
│   │   ├── payment.service.ts
│   │   ├── notification.service.ts
│   │   ├── announcement.service.ts
│   │   ├── mailer.service.ts
│   │   └── file.service.ts
│   │
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── user.validator.ts
│   │   ├── device.validator.ts
│   │   ├── messaging.validator.ts
│   │   ├── library.validator.ts
│   │   ├── ai.validator.ts
│   │   ├── subscription.validator.ts
│   │   ├── payment.validator.ts
│   │   └── announcement.validator.ts
│   │
│   └── middlewares/
│       ├── auth.middleware.ts
│       ├── role.middleware.ts
│       ├── plan.middleware.ts
│       └── rate-limit.middleware.ts
│
├── config/
│   ├── app.ts
│   ├── hash.ts
│   ├── cors.ts
│   ├── mail.ts
│   ├── database.ts
│   └── envManager.ts
│
├── start/
│   ├── routes/
│   │   ├── auth.route.ts
│   │   ├── user.route.ts
│   │   ├── device.route.ts
│   │   ├── messaging.route.ts
│   │   ├── library.route.ts
│   │   ├── ai.route.ts
│   │   ├── subscription.route.ts
│   │   ├── payment.route.ts
│   │   ├── notification.route.ts
│   │   ├── announcement.route.ts
│   │   └── updates.route.ts
│   ├── kernel.ts
│   └── env.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── templates/
│   ├── verification.html
│   ├── reset-password.html
│   ├── subscription-reminder.html
│   └── security-alert.html
│
├── app.ts           ← point d'entrée Hono (HttpContext, callAction, validateData)
└── server.ts        ← démarrage du serveur Node
```

---

## 4. Variables d'environnement

### `start/env.ts`

```ts
import vine from "@vinejs/vine";

/**
 * Schéma de validation de toutes les variables d'environnement.
 * Chaque variable est validée au démarrage via EnvManager.
 * Une variable absente ou invalide génère un avertissement console.
 */
const EnvSchema = {
  // ── Application ─────────────────────────────────────
  NODE_ENV: vine.enum(["development", "production", "test"]).optional(),
  HOST:     vine.string(),
  PORT:     vine.string(),

  // ── Base de données ──────────────────────────────────
  DATABASE_URL: vine.string(),

  // ── Sécurité ─────────────────────────────────────────
  JWT_SECRET:    vine.string(),
  CLIENT_DOMAIN: vine.string(),

  // ── Email (Gmail SMTP) ───────────────────────────────
  MAIL_HOST:        vine.string(),
  MAIL_PORT:        vine.number(),
  MAIL_USER:        vine.string(),
  MAIL_PASS:        vine.string(),
  MAIL_FROM_NAME:   vine.string(),
  MAIL_FROM_ADDRESS: vine.string(),

  // ── Stockage fichiers ─────────────────────────────────
  STORAGE_PATH:    vine.string(),
  MAX_FILE_SIZE_MB: vine.number(),

  // ── OTA Updates ──────────────────────────────────────
  APP_VERSION:       vine.string(),
  APP_BUILD_NUMBER:  vine.number(),
};

export default EnvSchema;
```

### `.env` (exemple complet)

```env
# Application
NODE_ENV=development
HOST=0.0.0.0
PORT=3000

# Base de données PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/pipolink

# Sécurité
JWT_SECRET=votre_secret_jwt_tres_long_et_aleatoire
CLIENT_DOMAIN=https://pipolink.app

# Email Gmail SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=votre.email@gmail.com
MAIL_PASS=votre_mot_de_passe_application
MAIL_FROM_NAME=PipoLink
MAIL_FROM_ADDRESS=no-reply@pipolink.app

# Stockage fichiers
STORAGE_PATH=./storage
MAX_FILE_SIZE_MB=50

# OTA
APP_VERSION=1.0.0
APP_BUILD_NUMBER=1
```

---

## 5. Configuration globale

### `config/database.ts`

```ts
import { PrismaClient } from "../generated/prisma/index.js";

/**
 * Singleton du client Prisma pour PostgreSQL.
 * Une seule instance partagée dans toute l'application.
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? ["query", "warn", "error"]
    : ["error"],
});
```

### `config/cors.ts`

```ts
import { cors } from "hono/cors";

/**
 * Configuration CORS.
 * En production, restreindre à l'origine du client mobile.
 */
export const corsConfig = cors({
  origin: process.env.CLIENT_DOMAIN ?? "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
});
```

### `config/mail.ts`

```ts
import { env } from "./envManager.js";

/**
 * Configuration Nodemailer pour Gmail SMTP.
 * Utilisé par MailerService pour tous les envois d'emails.
 */
export const mailConfig = {
  host:   env.get("MAIL_HOST"),
  port:   env.get("MAIL_PORT"),
  secure: false,
  auth: {
    user: env.get("MAIL_USER"),
    pass: env.get("MAIL_PASS"),
  },
  from: {
    name:    env.get("MAIL_FROM_NAME"),
    address: env.get("MAIL_FROM_ADDRESS"),
  },
};
```

---

## 6. Schéma Prisma

> Utiliser le schéma fourni tel quel — il est déjà complet et cohérent.
> Ajouter uniquement les éléments manquants listés ci-dessous.

### Ajouts manquants à intégrer dans le schéma fourni

```prisma
// ─── À ajouter dans le model Message ─────────────────────────────────────────
// Relier les messages au modèle Conversation (le schéma actuel utilise Chat)
// Décision : garder Chat pour la messagerie E2E existante,
//            Conversation pour la messagerie publique / annonces

// ─── Ajouter un enum MessageType manquant ────────────────────────────────────
enum MessageType {
  TEXT
  IMAGE
  DOCUMENT
  SYSTEM
}

// ─── Ajouter dans model Message ──────────────────────────────────────────────
// type   MessageType @default(TEXT)
// editedAt  DateTime? @db.Timestamptz
// deletedAt DateTime? @db.Timestamptz  ← soft delete

// ─── Ajouter model QrToken (liaison appareil via QR) ─────────────────────────
model QrToken {
  id        String   @id @db.Uuid @default(uuid())
  user_id   String   @db.Uuid
  token     String   @unique
  expiresAt DateTime @db.Timestamptz
  usedAt    DateTime? @db.Timestamptz
  createdAt DateTime @db.Timestamptz @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("qr_tokens")
}

// ─── Ajouter relation User → QrToken ─────────────────────────────────────────
// qrTokens  QrToken[]   ← dans model User
```

### Commandes Prisma à exécuter

```bash
# Générer le client Prisma
npx prisma generate

# Créer et appliquer la migration initiale
npx prisma migrate dev --name init

# Peupler la base avec les données de test
npx tsx prisma/seed.ts
```

---

## 7. Infrastructure partagée

### `app.ts` — fourni, ne pas modifier

> Le fichier `app.ts` fourni (HttpContext, callAction, validateData, ValidationException)
> est la base du projet. Il ne doit pas être modifié.
> Tous les controllers l'importent.

### Helper réponses API

```ts
// app/helpers/api-response.ts

/**
 * Helper centralisé pour standardiser toutes les réponses de l'API.
 * Chaque controller doit utiliser ces méthodes — jamais c.json() directement.
 */
export class ApiResponse {

  /**
   * Réponse de succès standard.
   * @param c       - Contexte Hono
   * @param data    - Données à retourner
   * @param message - Message lisible
   * @param status  - Code HTTP (défaut 200)
   */
  static success(c: any, data: unknown, message: string, status = 200) {
    return c.json({
      success: true,
      message,
      data,
      meta: { timestamp: new Date().toISOString() },
    }, status);
  }

  /**
   * Réponse de succès paginée.
   * @param c        - Contexte Hono
   * @param data     - Tableau de résultats
   * @param total    - Nombre total d'éléments
   * @param page     - Page courante
   * @param limit    - Nombre d'éléments par page
   */
  static paginated(c: any, data: unknown[], total: number, page: number, limit: number) {
    return c.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Réponse d'erreur métier.
   * @param c       - Contexte Hono
   * @param code    - Code d'erreur machine (ex: 'INVALID_OTP')
   * @param message - Message lisible par l'utilisateur
   * @param status  - Code HTTP
   * @param details - Données contextuelles optionnelles
   */
  static error(c: any, code: string, message: string, status: number, details?: unknown) {
    return c.json({
      success: false,
      error: code,
      message,
      details,
      meta: { timestamp: new Date().toISOString() },
    }, status);
  }
}
```

### Codes d'erreur standardisés

```ts
// app/helpers/error-codes.ts

/**
 * Codes d'erreur métier utilisés dans toute l'application.
 * Toujours utiliser ces constantes — jamais de chaîne en dur.
 */
export const ErrorCode = {
  // Authentification
  UNAUTHORIZED:          "UNAUTHORIZED",
  FORBIDDEN:             "FORBIDDEN",
  INVALID_CREDENTIALS:   "INVALID_CREDENTIALS",
  ACCOUNT_NOT_VERIFIED:  "ACCOUNT_NOT_VERIFIED",
  ACCOUNT_INACTIVE:      "ACCOUNT_INACTIVE",
  EMAIL_TAKEN:           "EMAIL_TAKEN",

  // OTP
  INVALID_OTP:           "INVALID_OTP",
  EXPIRED_OTP:           "EXPIRED_OTP",
  OTP_ATTEMPTS_EXCEEDED: "OTP_ATTEMPTS_EXCEEDED",
  OTP_COOLDOWN:          "OTP_COOLDOWN",

  // Tokens
  TOKEN_EXPIRED:         "TOKEN_EXPIRED",
  TOKEN_REVOKED:         "TOKEN_REVOKED",
  TOKEN_REUSE_DETECTED:  "TOKEN_REUSE_DETECTED",

  // Ressources
  NOT_FOUND:             "NOT_FOUND",
  CONFLICT:              "CONFLICT",

  // Fichiers
  FILE_TOO_LARGE:        "FILE_TOO_LARGE",
  INVALID_FILE_TYPE:     "INVALID_FILE_TYPE",

  // Abonnements / Quotas
  QUOTA_EXCEEDED:        "QUOTA_EXCEEDED",
  PREMIUM_REQUIRED:      "PREMIUM_REQUIRED",

  // Paiements
  PAYMENT_FAILED:        "PAYMENT_FAILED",
  INVALID_WEBHOOK:       "INVALID_WEBHOOK",

  // Système
  VALIDATION_ERROR:      "VALIDATION_ERROR",
  RATE_LIMITED:          "RATE_LIMITED",
  INTERNAL_ERROR:        "INTERNAL_ERROR",
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];
```

---

## 8. Kernel & Bootstrap

### `start/kernel.ts`

```ts
import { Hono } from "hono";
import { corsConfig }          from "../config/cors.js";
import { AuthRouter }          from "./routes/auth.route.js";
import { UserRouter }          from "./routes/user.route.js";
import { DeviceRouter }        from "./routes/device.route.js";
import { MessagingRouter }     from "./routes/messaging.route.js";
import { LibraryRouter }       from "./routes/library.route.js";
import { AiRouter }            from "./routes/ai.route.js";
import { SubscriptionRouter }  from "./routes/subscription.route.js";
import { PaymentRouter }       from "./routes/payment.route.js";
import { NotificationRouter }  from "./routes/notification.route.js";
import { AnnouncementRouter }  from "./routes/announcement.route.js";
import { UpdatesRouter }       from "./routes/updates.route.js";

/**
 * Configure et assemble le router principal de l'application.
 * Chaque module est monté sur son préfixe de route.
 *
 * @returns Instance Hono configurée avec tous les modules
 */
export function createRouter(): Hono {
  const router = new Hono();

  // Middlewares globaux
  router.use("*", corsConfig);

  // Modules
  router.route("/auth",          AuthRouter);
  router.route("/users",         UserRouter);
  router.route("/devices",       DeviceRouter);
  router.route("/conversations",  MessagingRouter);
  router.route("/library",       LibraryRouter);
  router.route("/ai",            AiRouter);
  router.route("/subscriptions", SubscriptionRouter);
  router.route("/payments",      PaymentRouter);
  router.route("/notifications", NotificationRouter);
  router.route("/announcements", AnnouncementRouter);
  router.route("/updates",       UpdatesRouter);

  // Route de santé
  router.get("/health", (c) => c.json({ status: "ok", version: process.env.APP_VERSION }));

  return router;
}
```

### `server.ts`

```ts
import { serve } from "@hono/node-server";
import { createRouter } from "./start/kernel.js";
import { env } from "./config/envManager.js";
import { prisma } from "./config/database.js";

/**
 * Point d'entrée du serveur.
 * Vérifie la connexion base de données avant de démarrer.
 */
async function bootstrap() {
  // Vérification connexion base de données
  await prisma.$connect();
  console.log("✅ Base de données connectée");

  const app = createRouter();

  serve({
    fetch: app.fetch,
    port: Number(env.get("PORT")),
    hostname: env.get("HOST"),
  }, (info) => {
    console.log(`🚀 Serveur PipoLink démarré sur http://${info.address}:${info.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Erreur de démarrage :", err);
  process.exit(1);
});
```

---

## 9. Module Auth

### Routes — `start/routes/auth.route.ts`

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { AuthController } from "../../app/controllers/auth.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const AuthRouter = new Hono();

AuthRouter
  // Inscription + vérification
  .post("/register",         callAction(AuthController, "register"))
  .post("/verify-otp",       callAction(AuthController, "verifyOtp"))
  .post("/resend-otp",       callAction(AuthController, "resendOtp"))

  // Connexion
  .post("/login",            callAction(AuthController, "login"))

  // Refresh & sessions
  .post("/refresh",          callAction(AuthController, "refresh"))
  .post("/logout",           authMiddleware, callAction(AuthController, "logout"))
  .post("/logout-all",       authMiddleware, callAction(AuthController, "logoutAll"))

  // Mot de passe
  .post("/change-password",  authMiddleware, callAction(AuthController, "changePassword"))
  .post("/forgot-password",  callAction(AuthController, "forgotPassword"))
  .post("/reset-password",   callAction(AuthController, "resetPassword"))

  // QR Login (appareil secondaire)
  .get("/qr/generate",       authMiddleware, callAction(AuthController, "generateQr"))
  .post("/qr/verify",        callAction(AuthController, "verifyQr"));
```

### Validator — `app/validators/auth.validator.ts`

```ts
import vine from "@vinejs/vine";

/**
 * Validateur d'inscription.
 * email    : format email valide, unique en base (vérification dans le service)
 * password : minimum 8 caractères, 1 majuscule, 1 chiffre
 */
export const registerValidator = vine.compile(
  vine.object({
    email:    vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8).regex(/^(?=.*[A-Z])(?=.*\d).+$/),
  })
);

/**
 * Validateur de connexion par email + mot de passe.
 */
export const loginValidator = vine.compile(
  vine.object({
    email:    vine.string().email(),
    password: vine.string().minLength(1),
  })
);

/**
 * Validateur de vérification OTP.
 * purpose : 'EMAIL_VERIFY' | 'PASSWORD_RESET'
 */
export const verifyOtpValidator = vine.compile(
  vine.object({
    email:   vine.string().email(),
    code:    vine.string().fixedLength(6),
    purpose: vine.enum(["EMAIL_VERIFY", "PASSWORD_RESET"]),
  })
);

/**
 * Validateur de renvoi d'OTP.
 */
export const resendOtpValidator = vine.compile(
  vine.object({
    email:   vine.string().email(),
    purpose: vine.enum(["EMAIL_VERIFY", "PASSWORD_RESET"]),
  })
);

/**
 * Validateur de changement de mot de passe (utilisateur connecté).
 */
export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(1),
    newPassword:     vine.string().minLength(8).regex(/^(?=.*[A-Z])(?=.*\d).+$/),
  })
);

/**
 * Validateur de réinitialisation de mot de passe (après OTP).
 */
export const resetPasswordValidator = vine.compile(
  vine.object({
    email:       vine.string().email(),
    code:        vine.string().fixedLength(6),
    newPassword: vine.string().minLength(8).regex(/^(?=.*[A-Z])(?=.*\d).+$/),
  })
);

/**
 * Validateur de refresh token.
 */
export const refreshValidator = vine.compile(
  vine.object({
    refreshToken: vine.string().minLength(1),
  })
);
```

### Controller — `app/controllers/auth.controller.ts`

```ts
import { HttpContext } from "../../app.js";
import { AuthService } from "../services/auth.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { ErrorCode } from "../helpers/error-codes.js";
import {
  registerValidator, loginValidator, verifyOtpValidator,
  resendOtpValidator, changePasswordValidator,
  resetPasswordValidator, refreshValidator,
} from "../validators/auth.validator.js";

/**
 * Contrôleur d'authentification.
 * Responsabilité unique : valider l'entrée, appeler le service, retourner la réponse.
 * Aucune logique métier ici.
 */
export class AuthController {
  private service = new AuthService();

  /**
   * POST /auth/register
   * Inscription d'un nouvel utilisateur avec email + mot de passe.
   */
  async register(c: HttpContext) {
    const payload = await c.validateUsing(registerValidator);
    const result  = await this.service.register(payload);
    return ApiResponse.success(c, result, "Compte créé. Vérifiez votre email.", 201);
  }

  /**
   * POST /auth/verify-otp
   * Vérification du code OTP pour activer le compte ou réinitialiser le mot de passe.
   */
  async verifyOtp(c: HttpContext) {
    const payload = await c.validateUsing(verifyOtpValidator);
    const result  = await this.service.verifyOtp(payload);
    return ApiResponse.success(c, result, "Vérification réussie.");
  }

  /**
   * POST /auth/resend-otp
   * Renvoi d'un OTP (soumis au cooldown de 60 secondes).
   */
  async resendOtp(c: HttpContext) {
    const payload = await c.validateUsing(resendOtpValidator);
    await this.service.resendOtp(payload);
    return ApiResponse.success(c, null, "Un nouveau code a été envoyé.");
  }

  /**
   * POST /auth/login
   * Connexion avec email + mot de passe. Retourne access token et refresh token.
   */
  async login(c: HttpContext) {
    const payload = await c.validateUsing(loginValidator);
    const result  = await this.service.login(payload);
    return ApiResponse.success(c, result, "Connexion réussie.");
  }

  /**
   * POST /auth/refresh
   * Rotation du refresh token. Révoque l'ancien et génère un nouveau couple de tokens.
   */
  async refresh(c: HttpContext) {
    const payload = await c.validateUsing(refreshValidator);
    const result  = await this.service.refreshTokens(payload.refreshToken);
    return ApiResponse.success(c, result, "Tokens actualisés.");
  }

  /**
   * POST /auth/logout
   * Révocation du refresh token de l'appareil courant.
   */
  async logout(c: HttpContext) {
    const payload = await c.validateUsing(refreshValidator);
    await this.service.logout(payload.refreshToken);
    return ApiResponse.success(c, null, "Déconnexion réussie.");
  }

  /**
   * POST /auth/logout-all
   * Révocation de tous les refresh tokens de l'utilisateur (tous les appareils).
   */
  async logoutAll(c: HttpContext) {
    const userId = c.get("userId") as string;
    await this.service.logoutAll(userId);
    return ApiResponse.success(c, null, "Déconnecté de tous les appareils.");
  }

  /**
   * POST /auth/change-password
   * Changement de mot de passe pour un utilisateur connecté.
   */
  async changePassword(c: HttpContext) {
    const userId  = c.get("userId") as string;
    const payload = await c.validateUsing(changePasswordValidator);
    await this.service.changePassword(userId, payload);
    return ApiResponse.success(c, null, "Mot de passe modifié avec succès.");
  }

  /**
   * POST /auth/forgot-password
   * Envoi d'un OTP de réinitialisation de mot de passe.
   * Répond toujours 200 même si l'email est inconnu (anti-énumération).
   */
  async forgotPassword(c: HttpContext) {
    const { email } = await c.req.json();
    await this.service.forgotPassword(email).catch(() => {});
    return ApiResponse.success(c, null, "Si cet email existe, un code vous a été envoyé.");
  }

  /**
   * POST /auth/reset-password
   * Réinitialisation du mot de passe après validation OTP.
   */
  async resetPassword(c: HttpContext) {
    const payload = await c.validateUsing(resetPasswordValidator);
    await this.service.resetPassword(payload);
    return ApiResponse.success(c, null, "Mot de passe réinitialisé avec succès.");
  }

  /**
   * GET /auth/qr/generate
   * Génère un token QR temporaire (120 secondes) pour lier un nouvel appareil.
   */
  async generateQr(c: HttpContext) {
    const userId = c.get("userId") as string;
    const result = await this.service.generateQrToken(userId);
    return ApiResponse.success(c, result, "Token QR généré.");
  }

  /**
   * POST /auth/qr/verify
   * Valide un token QR scanné par un nouvel appareil et crée sa session.
   */
  async verifyQr(c: HttpContext) {
    const { token, deviceName, platform, fingerprint } = await c.req.json();
    const result = await this.service.verifyQrToken({ token, deviceName, platform, fingerprint });
    return ApiResponse.success(c, result, "Appareil lié avec succès.", 201);
  }
}
```

### Service — `app/services/auth.service.ts`

```ts
import { prisma } from "../../config/database.js";
import { hash }   from "../../config/hash.js";
import { OtpService } from "./otp.service.js";
import { MailerService } from "./mailer.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { DateTime } from "luxon";
import crypto from "crypto";

/**
 * Service d'authentification.
 * Centralise toute la logique métier liée à l'auth :
 * inscription, vérification OTP, connexion, tokens, QR login.
 */
export class AuthService {
  private otp    = new OtpService();
  private mailer = new MailerService();

  /**
   * Inscrit un nouvel utilisateur.
   * - Vérifie l'unicité de l'email
   * - Hache le mot de passe (bcrypt cost 12)
   * - Crée l'utilisateur avec is_active = false
   * - Génère et envoie un OTP de vérification email
   *
   * @param payload - { email, password }
   * @returns       - { userId }
   * @throws        - EMAIL_TAKEN (409) si l'email est déjà utilisé
   */
  async register(payload: { email: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) throw { code: ErrorCode.EMAIL_TAKEN, status: 409, message: "Cet email est déjà utilisé." };

    const passwordHash = await hash.make(payload.password);

    const user = await prisma.user.create({
      data: {
        email:    payload.email,
        password: passwordHash,
        username: payload.email.split("@")[0],
        matricule: `STU-${Date.now()}`, // Provisoire jusqu'à l'onboarding
        public_key: "",
        role:      "student",
        is_active: false,
      },
    });

    await this.otp.sendOtp(user.id, user.email!, "EMAIL_VERIFY");

    return { userId: user.id };
  }

  /**
   * Vérifie un OTP et active le compte ou valide la réinitialisation.
   * - Valide le code, l'expiration, le nombre de tentatives
   * - Active le compte si purpose = EMAIL_VERIFY
   * - Génère les tokens JWT si activation
   *
   * @param payload - { email, code, purpose }
   * @returns       - AuthTokens si EMAIL_VERIFY, null si PASSWORD_RESET
   */
  async verifyOtp(payload: { email: string; code: string; purpose: string }) {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Utilisateur introuvable." };

    await this.otp.verifyOtp(user.id, payload.code, payload.purpose);

    if (payload.purpose === "EMAIL_VERIFY") {
      await prisma.user.update({ where: { id: user.id }, data: { is_active: true } });
      return await this._generateTokens(user);
    }

    return null;
  }

  /**
   * Renvoie un OTP en respectant le cooldown de 60 secondes.
   *
   * @param payload - { email, purpose }
   * @throws        - OTP_COOLDOWN (429) si l'intervalle n'est pas respecté
   */
  async resendOtp(payload: { email: string; purpose: string }) {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) return; // Silencieux pour anti-énumération

    await this.otp.sendOtp(user.id, user.email!, payload.purpose);
  }

  /**
   * Authentifie un utilisateur par email + mot de passe.
   * - Vérifie l'email et le mot de passe
   * - Vérifie que le compte est actif (is_active = true)
   * - Génère et retourne les tokens JWT
   *
   * @param payload - { email, password }
   * @returns       - AuthTokens
   * @throws        - INVALID_CREDENTIALS (401), ACCOUNT_NOT_VERIFIED (403)
   */
  async login(payload: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) throw { code: ErrorCode.INVALID_CREDENTIALS, status: 401, message: "Email ou mot de passe incorrect." };

    const valid = await hash.compare(payload.password, user.password);
    if (!valid) throw { code: ErrorCode.INVALID_CREDENTIALS, status: 401, message: "Email ou mot de passe incorrect." };

    if (!user.is_active) throw { code: ErrorCode.ACCOUNT_NOT_VERIFIED, status: 403, message: "Veuillez vérifier votre email avant de vous connecter." };
    if (user.is_excluded) throw { code: ErrorCode.ACCOUNT_INACTIVE, status: 403, message: "Votre compte a été suspendu." };

    await prisma.auditLog.create({
      data: { user_id: user.id, action: "LOGIN" },
    });

    return await this._generateTokens(user);
  }

  /**
   * Rotation du refresh token.
   * - Vérifie le token haché en base
   * - Vérifie qu'il n'est pas révoqué
   * - Détecte la réutilisation (rejeu) → révoque toutes les sessions
   * - Génère un nouveau couple access + refresh token
   *
   * @param refreshToken - Token brut envoyé par le client
   * @returns            - { accessToken, refreshToken }
   */
  async refreshTokens(refreshToken: string) {
    const tokenHash = await hash.sha512(refreshToken);
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!record) throw { code: ErrorCode.TOKEN_REVOKED, status: 401, message: "Token invalide." };

    // Détection de rejeu : token déjà révoqué utilisé à nouveau
    if (record.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { user_id: record.user_id },
        data:  { revokedAt: new Date() },
      });
      throw { code: ErrorCode.TOKEN_REUSE_DETECTED, status: 401, message: "Session compromise. Reconnectez-vous." };
    }

    if (new Date() > record.expiresAt) throw { code: ErrorCode.TOKEN_EXPIRED, status: 401, message: "Token expiré. Reconnectez-vous." };

    // Révocation de l'ancien token
    await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: record.user_id } });
    return await this._generateTokens(user, record.device_id ?? undefined);
  }

  /**
   * Révoque le refresh token de l'appareil courant.
   *
   * @param refreshToken - Token brut envoyé par le client
   */
  async logout(refreshToken: string) {
    const tokenHash = await hash.sha512(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data:  { revokedAt: new Date() },
    });
  }

  /**
   * Révoque tous les refresh tokens de l'utilisateur (déconnexion globale).
   *
   * @param userId - Identifiant de l'utilisateur
   */
  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { user_id: userId, revokedAt: null },
      data:  { revokedAt: new Date() },
    });
    await prisma.auditLog.create({ data: { user_id: userId, action: "LOGOUT" } });
  }

  /**
   * Change le mot de passe d'un utilisateur connecté.
   * - Vérifie le mot de passe actuel
   * - Hache le nouveau mot de passe
   * - Révoque toutes les sessions (sécurité)
   * - Envoie un email d'alerte sécurité
   *
   * @param userId  - Identifiant de l'utilisateur
   * @param payload - { currentPassword, newPassword }
   */
  async changePassword(userId: string, payload: { currentPassword: string; newPassword: string }) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const valid = await hash.compare(payload.currentPassword, user.password);
    if (!valid) throw { code: ErrorCode.INVALID_CREDENTIALS, status: 401, message: "Mot de passe actuel incorrect." };

    const newHash = await hash.make(payload.newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: newHash } });
    await this.logoutAll(userId);

    await prisma.auditLog.create({ data: { user_id: userId, action: "PASSWORD_CHANGED" } });
    if (user.email) await this.mailer.sendSecurityAlert(user.email, "Changement de mot de passe");
  }

  /**
   * Initie la réinitialisation de mot de passe par email.
   * Répond silencieusement si l'email est inconnu (anti-énumération).
   *
   * @param email - Email de l'utilisateur
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.email) return;
    await this.otp.sendOtp(user.id, user.email, "PASSWORD_RESET");
  }

  /**
   * Réinitialise le mot de passe après validation de l'OTP de reset.
   *
   * @param payload - { email, code, newPassword }
   */
  async resetPassword(payload: { email: string; code: string; newPassword: string }) {
    await this.verifyOtp({ email: payload.email, code: payload.code, purpose: "PASSWORD_RESET" });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: payload.email } });
    const newHash = await hash.make(payload.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: newHash } });
    await this.logoutAll(user.id);
  }

  /**
   * Génère un token QR temporaire pour lier un nouvel appareil.
   * Le token expire après 120 secondes.
   *
   * @param userId - Identifiant de l'utilisateur propriétaire
   * @returns      - { token, expiresAt }
   */
  async generateQrToken(userId: string) {
    const token     = hash.generateRandomString(32);
    const expiresAt = DateTime.utc().plus({ seconds: 120 }).toJSDate();

    await prisma.qrToken.create({ data: { user_id: userId, token, expiresAt } });

    return { token, expiresAt };
  }

  /**
   * Valide un token QR scanné et crée la session du nouvel appareil.
   *
   * @param payload - { token, deviceName, platform, fingerprint }
   * @returns       - AuthTokens pour le nouvel appareil
   * @throws        - NOT_FOUND (404) si token invalide ou expiré
   */
  async verifyQrToken(payload: { token: string; deviceName: string; platform: string; fingerprint: string }) {
    const record = await prisma.qrToken.findUnique({ where: { token: payload.token } });

    if (!record || record.usedAt || new Date() > record.expiresAt) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Token QR invalide ou expiré." };
    }

    await prisma.qrToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    // Création de l'appareil
    const existingCount = await prisma.device.count({ where: { user_id: record.user_id, revokedAt: null } });
    const device = await prisma.device.create({
      data: {
        user_id:     record.user_id,
        name:        payload.deviceName,
        platform:    payload.platform,
        fingerprint: payload.fingerprint,
        isPrimary:   existingCount === 0,
      },
    });

    await prisma.auditLog.create({ data: { user_id: record.user_id, action: "DEVICE_LINKED" } });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: record.user_id } });
    return await this._generateTokens(user, device.id);
  }

  // ── Méthodes privées ──────────────────────────────────────────────────────

  /**
   * Génère un access token JWT et un refresh token pour un utilisateur.
   * Stocke le refresh token haché en base de données.
   *
   * @param user     - Utilisateur authentifié
   * @param deviceId - ID de l'appareil (optionnel)
   * @returns        - { accessToken, refreshToken, user }
   */
  private async _generateTokens(user: any, deviceId?: string) {
    const accessToken = await hash.jwt.encode({
      sub:      user.id,
      deviceId: deviceId ?? null,
      role:     user.role,
    });

    const rawRefreshToken = hash.generateRandomString(64);
    const tokenHash       = await hash.sha512(rawRefreshToken);
    const expiresAt       = DateTime.utc().plus({ days: 30 }).toJSDate();

    await prisma.refreshToken.create({
      data: { user_id: user.id, device_id: deviceId ?? null, tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresAt,
      user: {
        id:       user.id,
        email:    user.email,
        username: user.username,
        role:     user.role,
      },
    };
  }
}
```

---

## 10. Module Users

### Routes — `start/routes/user.route.ts`

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { UserController } from "../../app/controllers/user.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const UserRouter = new Hono();

UserRouter
  .get("/me",                authMiddleware, callAction(UserController, "me"))
  .put("/me",                authMiddleware, callAction(UserController, "updateProfile"))
  .post("/me/onboarding",    authMiddleware, callAction(UserController, "completeOnboarding"))
  .post("/me/avatar",        authMiddleware, callAction(UserController, "uploadAvatar"))
  .delete("/me",             authMiddleware, callAction(UserController, "deleteAccount"));
```

### Validator — `app/validators/user.validator.ts`

```ts
import vine from "@vinejs/vine";

/**
 * Validateur de complétion du profil (onboarding).
 * Appelé après la première connexion pour enrichir le profil utilisateur.
 */
export const onboardingValidator = vine.compile(
  vine.object({
    firstname: vine.string().minLength(2).maxLength(100),
    lastname:  vine.string().minLength(2).maxLength(100),
    username:  vine.string().minLength(3).maxLength(30).optional(),
    phone:     vine.string().optional(),
    gender:    vine.enum(["M", "F", "OTHER"]).optional(),
    matricule: vine.string().optional(),
    niveau:    vine.string().optional(),
    filiere:   vine.string().optional(),
  })
);

/**
 * Validateur de mise à jour du profil (champs partiels).
 */
export const updateProfileValidator = vine.compile(
  vine.object({
    firstname: vine.string().minLength(2).optional(),
    lastname:  vine.string().minLength(2).optional(),
    username:  vine.string().minLength(3).optional(),
    phone:     vine.string().optional(),
    bio:       vine.string().maxLength(500).optional(),
  })
);
```

### Service — `app/services/user.service.ts`

```ts
import { prisma }      from "../../config/database.js";
import { FileService } from "./file.service.js";
import { ErrorCode }   from "../helpers/error-codes.js";

/**
 * Service de gestion du profil utilisateur.
 */
export class UserService {
  private fileService = new FileService();

  /**
   * Récupère le profil complet de l'utilisateur connecté.
   * Inclut le profil, l'abonnement et le nombre d'appareils actifs.
   *
   * @param userId - Identifiant de l'utilisateur
   * @returns      - Utilisateur avec profil et abonnement
   */
  async getMe(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile:      true,
        subscription: true,
        devices:      { where: { revokedAt: null } },
      },
    });
  }

  /**
   * Complète le profil lors de l'onboarding (première connexion).
   * Crée ou met à jour UserProfile. Marque is_configured = true.
   *
   * @param userId  - Identifiant de l'utilisateur
   * @param payload - Champs du profil
   */
  async completeOnboarding(userId: string, payload: Record<string, any>) {
    await prisma.userProfile.upsert({
      where:  { user_id: userId },
      update: payload,
      create: { user_id: userId, ...payload },
    });

    await prisma.user.update({ where: { id: userId }, data: { is_configured: true } });
  }

  /**
   * Met à jour partiellement le profil.
   *
   * @param userId  - Identifiant de l'utilisateur
   * @param payload - Champs à modifier
   */
  async updateProfile(userId: string, payload: Record<string, any>) {
    await prisma.userProfile.upsert({
      where:  { user_id: userId },
      update: payload,
      create: { user_id: userId, firstname: "", lastname: "", ...payload },
    });
  }

  /**
   * Traite et enregistre l'avatar de l'utilisateur.
   * Redimensionne via Sharp (256x256, WebP).
   *
   * @param userId - Identifiant de l'utilisateur
   * @param file   - Fichier image uploadé (Buffer)
   */
  async uploadAvatar(userId: string, file: Buffer) {
    const url = await this.fileService.processAvatar(userId, file);

    await prisma.userProfile.upsert({
      where:  { user_id: userId },
      update: { avatarUrl: url },
      create: { user_id: userId, firstname: "", lastname: "", avatarUrl: url },
    });

    return { avatarUrl: url };
  }

  /**
   * Supprime le compte utilisateur (soft delete : is_excluded = true).
   * Révoque toutes les sessions actives.
   *
   * @param userId - Identifiant de l'utilisateur
   */
  async deleteAccount(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data:  { revokedAt: new Date() },
    });

    await prisma.user.update({ where: { id: userId }, data: { is_excluded: true } });

    await prisma.auditLog.create({ data: { user_id: userId, action: "ACCOUNT_DELETED" } });
  }
}
```

---

## 11. Module Devices

### Routes — `start/routes/device.route.ts`

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { DeviceController } from "../../app/controllers/device.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const DeviceRouter = new Hono();

DeviceRouter
  .get("/",       authMiddleware, callAction(DeviceController, "list"))
  .delete("/:id", authMiddleware, callAction(DeviceController, "revoke"));
```

### Service — `app/services/device.service.ts`

```ts
import { prisma }      from "../../config/database.js";
import { MailerService } from "./mailer.service.js";
import { ErrorCode }   from "../helpers/error-codes.js";

/**
 * Service de gestion des appareils de confiance.
 */
export class DeviceService {
  private mailer = new MailerService();

  /**
   * Liste les appareils actifs (non révoqués) d'un utilisateur.
   *
   * @param userId - Identifiant de l'utilisateur
   * @returns      - Tableau des appareils actifs
   */
  async listDevices(userId: string) {
    return await prisma.device.findMany({
      where:   { user_id: userId, revokedAt: null },
      orderBy: { lastActiveAt: "desc" },
    });
  }

  /**
   * Révoque un appareil spécifique.
   * - Interdit la révocation de l'appareil principal
   * - Révoque les refresh tokens associés
   * - Envoie un email d'alerte sécurité
   *
   * @param userId   - Identifiant de l'utilisateur
   * @param deviceId - Identifiant de l'appareil à révoquer
   */
  async revokeDevice(userId: string, deviceId: string) {
    const device = await prisma.device.findFirst({ where: { id: deviceId, user_id: userId } });
    if (!device) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Appareil introuvable." };
    if (device.isPrimary) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "L'appareil principal ne peut pas être révoqué." };

    await prisma.device.update({ where: { id: deviceId }, data: { revokedAt: new Date() } });
    await prisma.refreshToken.updateMany({ where: { device_id: deviceId }, data: { revokedAt: new Date() } });
    await prisma.auditLog.create({ data: { user_id: userId, action: "DEVICE_REVOKED", targetId: deviceId } });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) await this.mailer.sendSecurityAlert(user.email, "Appareil révoqué : " + device.name);
  }
}
```

---

## 12. Module Messaging

### Routes — `start/routes/messaging.route.ts`

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { MessagingController } from "../../app/controllers/messaging.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const MessagingRouter = new Hono();

MessagingRouter
  .get("/",                    authMiddleware, callAction(MessagingController, "listConversations"))
  .post("/",                   authMiddleware, callAction(MessagingController, "createConversation"))
  .get("/:id/messages",        authMiddleware, callAction(MessagingController, "getMessages"))
  .post("/:id/messages",       authMiddleware, callAction(MessagingController, "sendMessage"))
  .post("/:id/messages/upload", authMiddleware, callAction(MessagingController, "uploadFile"))
  .post("/:id/read",           authMiddleware, callAction(MessagingController, "markAsRead"));
```

### Validator — `app/validators/messaging.validator.ts`

```ts
import vine from "@vinejs/vine";

/**
 * Validateur d'envoi de message texte.
 * Le contenu est chiffré côté client — le backend ne le lit pas.
 */
export const sendMessageValidator = vine.compile(
  vine.object({
    content:    vine.string().minLength(1),          // ciphertext AES-GCM (base64)
    iv:         vine.string().minLength(1),           // vecteur d'initialisation
    type:       vine.enum(["TEXT", "IMAGE", "DOCUMENT"]).optional(),
  })
);
```

### Service — `app/services/messaging.service.ts`

```ts
import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";

/**
 * Service de messagerie.
 * Le contenu des messages est chiffré côté client (E2E).
 * Le backend stocke et relaie les ciphertexts sans les déchiffrer.
 */
export class MessagingService {

  /**
   * Liste les conversations d'un utilisateur avec le dernier message.
   * Trie par date de dernier message décroissante.
   *
   * @param userId - Identifiant de l'utilisateur
   * @returns      - Tableau de conversations avec métadonnées
   */
  async listConversations(userId: string) {
    const members = await prisma.conversationMember.findMany({
      where:   { user_id: userId },
      include: { conversation: true },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    return members.map((m) => m.conversation);
  }

  /**
   * Récupère les messages d'une conversation avec pagination.
   * Vérifie que l'utilisateur est membre de la conversation.
   *
   * @param userId         - Identifiant de l'utilisateur
   * @param conversationId - Identifiant de la conversation
   * @param page           - Numéro de page (défaut 1)
   * @param limit          - Taille de page (défaut 30)
   * @returns              - { messages, total }
   */
  async getMessages(userId: string, conversationId: string, page = 1, limit = 30) {
    await this._assertMember(userId, conversationId);

    const skip  = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where:   { chat_id: conversationId, deletedAt: null },
        skip,
        take:    limit,
        orderBy: { created_at: "desc" },
        include: { sender: { select: { id: true, username: true, profile_url: true } } },
      }),
      prisma.message.count({ where: { chat_id: conversationId, deletedAt: null } }),
    ]);

    return { messages, total };
  }

  /**
   * Envoie un message chiffré dans une conversation.
   * Le champ `cipherText` est le contenu chiffré AES-GCM côté client.
   *
   * @param userId         - Identifiant de l'expéditeur
   * @param conversationId - Identifiant de la conversation
   * @param payload        - { content (= cipherText), iv, type }
   * @returns              - Message créé
   */
  async sendMessage(userId: string, conversationId: string, payload: { content: string; iv: string; type?: string }) {
    await this._assertMember(userId, conversationId);

    const message = await prisma.message.create({
      data: {
        chat_id:    conversationId,
        sender_id:  userId,
        cipherText: payload.content,
        iv:         payload.iv,
        status:     "send",
        type:       (payload.type ?? "TEXT") as any,
      },
    });

    await prisma.chat.update({ where: { id: conversationId }, data: { created_at: new Date() } });

    return message;
  }

  /**
   * Marque les messages d'une conversation comme lus.
   * Met à jour lastReadAt du membre dans la conversation.
   *
   * @param userId         - Identifiant de l'utilisateur
   * @param conversationId - Identifiant de la conversation
   */
  async markAsRead(userId: string, conversationId: string) {
    await prisma.conversationMember.updateMany({
      where: { user_id: userId, conversation_id: conversationId },
      data:  { lastReadAt: new Date() },
    });
  }

  // ── Méthodes privées ──────────────────────────────────────────────────────

  /**
   * Vérifie qu'un utilisateur est membre d'une conversation.
   * Lance une erreur FORBIDDEN s'il ne l'est pas.
   */
  private async _assertMember(userId: string, conversationId: string) {
    const member = await prisma.conversationMember.findFirst({
      where: { user_id: userId, conversation_id: conversationId },
    });
    if (!member) throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Accès refusé à cette conversation." };
  }
}
```

---

## 13. Module Library

### Routes — `start/routes/library.route.ts`

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { LibraryController } from "../../app/controllers/library.controller.js";
import { FolderController }  from "../../app/controllers/folder.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { roleMiddleware }  from "../../app/middlewares/role.middleware.js";

export const LibraryRouter = new Hono();

// Dossiers
LibraryRouter
  .get("/folders",        authMiddleware, callAction(FolderController, "list"))
  .get("/folders/:id",    authMiddleware, callAction(FolderController, "show"))
  .post("/folders",       authMiddleware, roleMiddleware(["admin", "staff"]), callAction(FolderController, "create"))
  .delete("/folders/:id", authMiddleware, roleMiddleware(["admin"]), callAction(FolderController, "remove"));

// Documents
LibraryRouter
  .get("/documents",             authMiddleware, callAction(LibraryController, "listDocuments"))
  .post("/documents",            authMiddleware, callAction(LibraryController, "uploadDocument"))
  .get("/documents/search",      authMiddleware, callAction(LibraryController, "searchDocuments"))
  .get("/documents/:id/download", authMiddleware, callAction(LibraryController, "downloadDocument"))
  .put("/documents/:id",         authMiddleware, callAction(LibraryController, "updateDocument"))
  .delete("/documents/:id",      authMiddleware, callAction(LibraryController, "deleteDocument"))
  .post("/documents/:id/moderate", authMiddleware, roleMiddleware(["admin", "staff"]), callAction(LibraryController, "moderateDocument"));
```

### Validator — `app/validators/library.validator.ts`

```ts
import vine from "@vinejs/vine";

/**
 * Validateur d'upload de document académique.
 */
export const uploadDocumentValidator = vine.compile(
  vine.object({
    title:       vine.string().minLength(3).maxLength(255),
    folderId:    vine.string().uuid(),
    description: vine.string().optional(),
    niveau:      vine.string().optional(),
    filiere:     vine.string().optional(),
    ue:          vine.string().optional(),
    type:        vine.enum(["COURS", "TD", "TP", "CC", "EXAMEN", "RESUME", "AUTRE"]).optional(),
    year:        vine.number().min(2000).max(2100).optional(),
    tags:        vine.array(vine.string()).optional(),
    isPublic:    vine.boolean().optional(),
  })
);

/**
 * Validateur de décision de modération.
 */
export const moderateDocumentValidator = vine.compile(
  vine.object({
    decision:        vine.enum(["APPROVED", "REJECTED"]),
    rejectionReason: vine.string().optional(),
  })
);
```

### Service — `app/services/library.service.ts`

```ts
import { prisma }       from "../../config/database.js";
import { FileService }  from "./file.service.js";
import { ErrorCode }    from "../helpers/error-codes.js";

/**
 * Service de gestion de la bibliothèque académique.
 */
export class LibraryService {
  private fileService = new FileService();

  /**
   * Liste les documents d'un dossier avec filtres et pagination.
   * N'affiche que les documents APPROVED aux rôles non-admin.
   *
   * @param folderId - Identifiant du dossier
   * @param role     - Rôle de l'utilisateur
   * @param filters  - Filtres optionnels (type, niveau, année)
   * @param page     - Numéro de page
   * @param limit    - Taille de page
   */
  async listDocuments(folderId: string, role: string, filters: Record<string, any>, page = 1, limit = 20) {
    const where: Record<string, any> = { folder_id: folderId };

    if (role !== "admin" && role !== "staff") {
      where.moderationStatus = "APPROVED";
      where.isPublic = true;
    }

    if (filters.type)   where.type   = filters.type;
    if (filters.niveau) where.niveau = filters.niveau;
    if (filters.year)   where.year   = Number(filters.year);

    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where, skip, take: limit,
        include: { uploadedBy: { select: { username: true } }, tags: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count({ where }),
    ]);

    return { documents, total };
  }

  /**
   * Upload un document avec validation du fichier via FileService.
   * Gestion des tags : crée les tags inexistants, réutilise les existants.
   * Statut initial : PENDING (en attente de modération).
   *
   * @param userId  - Identifiant de l'uploader
   * @param payload - Métadonnées du document
   * @param file    - Fichier uploadé (Buffer)
   * @param meta    - { originalName, mimeType }
   */
  async uploadDocument(userId: string, payload: any, file: Buffer, meta: { originalName: string; mimeType: string }) {
    const { url, size } = await this.fileService.storeDocument(file, meta.originalName, meta.mimeType);

    const tagConnections = payload.tags
      ? await Promise.all(
          (payload.tags as string[]).map((name: string) =>
            prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
          )
        )
      : [];

    const document = await prisma.document.create({
      data: {
        folder_id:      payload.folderId,
        uploaded_by_id: userId,
        title:          payload.title,
        description:    payload.description,
        niveau:         payload.niveau,
        filiere:        payload.filiere,
        ue:             payload.ue,
        type:           payload.type ?? "AUTRE",
        year:           payload.year,
        fileUrl:        url,
        fileName:       meta.originalName,
        fileSize:       size,
        mimeType:       meta.mimeType,
        isPublic:       payload.isPublic ?? true,
        tags:           { connect: tagConnections.map((t) => ({ id: t.id })) },
      },
      include: { tags: true },
    });

    await prisma.auditLog.create({ data: { user_id: userId, action: "DOCUMENT_UPLOADED", targetId: document.id } });

    return document;
  }

  /**
   * Enregistre le téléchargement et retourne l'URL du fichier.
   * Incrémente le compteur downloadCount.
   *
   * @param documentId - Identifiant du document
   * @param userId     - Identifiant du téléchargeur (optionnel)
   */
  async downloadDocument(documentId: string, userId?: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Document introuvable." };

    await Promise.all([
      prisma.document.update({ where: { id: documentId }, data: { downloadCount: { increment: 1 } } }),
      prisma.download.create({ data: { document_id: documentId, user_id: userId } }),
    ]);

    return { fileUrl: doc.fileUrl };
  }

  /**
   * Modère un document (APPROVED ou REJECTED).
   * Notifie l'uploader via le service de notifications.
   *
   * @param documentId - Identifiant du document
   * @param decision   - 'APPROVED' | 'REJECTED'
   * @param reason     - Raison du rejet (obligatoire si REJECTED)
   */
  async moderateDocument(documentId: string, decision: string, reason?: string) {
    return await prisma.document.update({
      where: { id: documentId },
      data:  {
        moderationStatus: decision as any,
        rejectionReason:  decision === "REJECTED" ? reason : null,
      },
    });
  }

  /**
   * Recherche des documents par texte libre.
   * Filtre sur title, ue, description.
   *
   * @param query - Terme de recherche
   * @param role  - Rôle de l'utilisateur (pour filtrer la modération)
   */
  async searchDocuments(query: string, role: string) {
    const where: Record<string, any> = {
      OR: [
        { title:       { contains: query, mode: "insensitive" } },
        { ue:          { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    };

    if (role !== "admin" && role !== "staff") where.moderationStatus = "APPROVED";

    return await prisma.document.findMany({ where, include: { tags: true }, take: 20 });
  }
}
```

---

## 14. Module AI

### Routes — `start/routes/ai.route.ts`

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { AiController } from "../../app/controllers/ai.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const AiRouter = new Hono();

AiRouter
  .post("/chat",              authMiddleware, callAction(AiController, "chat"))
  .get("/sessions",           authMiddleware, callAction(AiController, "getSessions"))
  .delete("/sessions",        authMiddleware, callAction(AiController, "clearHistory"))
  .get("/sessions/:id",       authMiddleware, callAction(AiController, "getSession"));
```

### Service — `app/services/ai.service.ts`

```ts
import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { DateTime } from "luxon";

/**
 * Service de gestion du chat IA.
 * Gère les sessions, les quotas par plan, et appelle le provider IA.
 *
 * QUOTA :
 *   FREE    : 20 messages par jour
 *   PREMIUM : illimité
 */
export class AiService {

  /**
   * Envoie un message à l'IA et stocke la réponse.
   * Vérifie le quota avant d'appeler le provider.
   *
   * @param userId    - Identifiant de l'utilisateur
   * @param sessionId - Identifiant de session (null = nouvelle session)
   * @param message   - Contenu du message
   * @param plan      - Plan d'abonnement de l'utilisateur
   * @returns         - Message IA généré
   */
  async chat(userId: string, sessionId: string | null, message: string, plan: string) {
    await this._checkQuota(userId, plan);

    // Récupère ou crée la session
    let session = sessionId
      ? await prisma.aiSession.findFirst({ where: { id: sessionId, user_id: userId } })
      : null;

    if (!session) {
      session = await prisma.aiSession.create({
        data: {
          user_id: userId,
          title:   message.substring(0, 50),
        },
      });
    }

    // Stocke le message utilisateur
    await prisma.aiMessage.create({
      data: { session_id: session.id, role: "user", content: message },
    });

    // Appelle le provider IA (stub pour l'instant)
    const aiResponse = await this._callProvider(message);

    // Stocke la réponse IA
    const aiMessage = await prisma.aiMessage.create({
      data: { session_id: session.id, role: "assistant", content: aiResponse },
    });

    return { session, message: aiMessage };
  }

  /**
   * Récupère les sessions IA de l'utilisateur avec le dernier message.
   *
   * @param userId - Identifiant de l'utilisateur
   */
  async getSessions(userId: string) {
    return await prisma.aiSession.findMany({
      where:   { user_id: userId },
      include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Supprime tout l'historique IA de l'utilisateur.
   *
   * @param userId - Identifiant de l'utilisateur
   */
  async clearHistory(userId: string) {
    await prisma.aiSession.deleteMany({ where: { user_id: userId } });
  }

  // ── Méthodes privées ──────────────────────────────────────────────────────

  /**
   * Vérifie le quota journalier de l'utilisateur.
   * Compte les messages envoyés aujourd'hui.
   *
   * @param userId - Identifiant de l'utilisateur
   * @param plan   - 'FREE' | 'PREMIUM'
   * @throws       - QUOTA_EXCEEDED (402) si limite atteinte
   */
  private async _checkQuota(userId: string, plan: string) {
    if (plan === "PREMIUM") return;

    const startOfDay = DateTime.utc().startOf("day").toJSDate();
    const count = await prisma.aiMessage.count({
      where: {
        role:      "user",
        session:   { user_id: userId },
        createdAt: { gte: startOfDay },
      },
    });

    if (count >= 20) {
      throw { code: ErrorCode.QUOTA_EXCEEDED, status: 402, message: "Limite de 20 messages IA par jour atteinte. Passez en PREMIUM pour un accès illimité." };
    }
  }

  /**
   * Appelle le provider IA.
   * Actuellement : stub qui retourne un message fixe.
   * Remplacer cette méthode lors de l'intégration d'un vrai provider.
   *
   * @param _message - Message de l'utilisateur (ignoré par le stub)
   * @returns        - Réponse IA
   */
  private async _callProvider(_message: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 1200)); // Simule la latence
    return "Cette fonctionnalité sera bientôt disponible. Restez connecté pour les prochaines mises à jour de PipoLink ! 🚀";
  }
}
```

---

## 15. Module Subscriptions

### Routes — `start/routes/subscription.route.ts`

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { SubscriptionController } from "../../app/controllers/subscription.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const SubscriptionRouter = new Hono();

SubscriptionRouter
  .get("/me",       authMiddleware, callAction(SubscriptionController, "getMySubscription"))
  .post("/activate", authMiddleware, callAction(SubscriptionController, "activate"));
```

### Service — `app/services/subscription.service.ts`

```ts
import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { DateTime } from "luxon";

/**
 * Service de gestion des abonnements.
 * Plans : FREE (illimité) | PREMIUM (30 jours, renouvelable)
 */
export class SubscriptionService {

  /**
   * Récupère ou crée l'abonnement de l'utilisateur.
   * Si aucun abonnement n'existe, crée automatiquement un abonnement FREE.
   *
   * @param userId - Identifiant de l'utilisateur
   * @returns      - Abonnement actif
   */
  async getOrCreate(userId: string) {
    const existing = await prisma.subscription.findUnique({ where: { user_id: userId } });
    if (existing) return existing;

    return await prisma.subscription.create({
      data: { user_id: userId, plan: "FREE", status: "ACTIVE" },
    });
  }

  /**
   * Active ou renouvelle un abonnement PREMIUM.
   * Vérifie que le paiement associé est en statut SUCCESS.
   *
   * @param userId    - Identifiant de l'utilisateur
   * @param paymentId - Identifiant du paiement validé
   * @returns         - Abonnement mis à jour
   */
  async activate(userId: string, paymentId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, user_id: userId, status: "SUCCESS" },
    });

    if (!payment) throw { code: ErrorCode.PAYMENT_FAILED, status: 402, message: "Paiement invalide ou non confirmé." };

    const expiresAt = DateTime.utc().plus({ days: 30 }).toJSDate();

    const subscription = await prisma.subscription.upsert({
      where:  { user_id: userId },
      update: { plan: "PREMIUM", status: "ACTIVE", expiresAt, renewedAt: new Date() },
      create: { user_id: userId, plan: "PREMIUM", status: "ACTIVE", expiresAt },
    });

    await prisma.auditLog.create({ data: { user_id: userId, action: "SUBSCRIPTION_ACTIVATED" } });

    return subscription;
  }

  /**
   * Expire les abonnements PREMIUM arrivés à échéance.
   * Appelé par le cron job subscription-expiry.
   * Repasse le plan en FREE et le statut en EXPIRED.
   */
  async expireOverdue() {
    const overdues = await prisma.subscription.findMany({
      where: { plan: "PREMIUM", status: "ACTIVE", expiresAt: { lte: new Date() } },
    });

    for (const sub of overdues) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data:  { plan: "FREE", status: "EXPIRED" },
      });
      await prisma.auditLog.create({ data: { user_id: sub.user_id, action: "SUBSCRIPTION_EXPIRED" } });
    }

    return overdues.length;
  }
}
```

---

## 16. Module Payments

### Routes — `start/routes/payment.route.ts`

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { PaymentController } from "../../app/controllers/payment.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const PaymentRouter = new Hono();

PaymentRouter
  .post("/initiate",   authMiddleware, callAction(PaymentController, "initiate"))
  .get("/:id/status",  authMiddleware, callAction(PaymentController, "status"))
  .post("/webhook",    callAction(PaymentController, "webhook")); // Pas d'auth : appelé par le provider
```

### Service — `app/services/payment.service.ts`

```ts
import { prisma } from "../../config/database.js";
import { SubscriptionService } from "./subscription.service.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { DateTime } from "luxon";

/**
 * Service de paiement.
 * Provider actuel : simulateur (SimulatorProvider).
 * Pour intégrer un vrai provider : implémenter l'interface PaymentProvider.
 */
export class PaymentService {
  private subService = new SubscriptionService();

  /**
   * Initie un paiement et crée une transaction en statut PENDING.
   *
   * @param userId - Identifiant de l'utilisateur
   * @param amount - Montant en XAF
   * @returns      - { paymentId, expiresAt }
   */
  async initiate(userId: string, amount: number) {
    const subscription = await this.subService.getOrCreate(userId);
    const expiresAt    = DateTime.utc().plus({ minutes: 15 }).toJSDate();

    const payment = await prisma.payment.create({
      data: {
        user_id:         userId,
        subscription_id: subscription.id,
        amount,
        currency:        "XAF",
        status:          "PENDING",
        provider:        "simulator",
        providerRef:     `SIM-${Date.now()}`,
        expiresAt,
      },
    });

    return { paymentId: payment.id, expiresAt };
  }

  /**
   * Simule la confirmation d'un paiement (SimulatorProvider).
   * En production : appeler l'API du vrai provider de paiement.
   *
   * @param paymentId - Identifiant du paiement
   * @param userId    - Identifiant de l'utilisateur
   * @returns         - Paiement mis à jour
   */
  async confirmSimulated(paymentId: string, userId: string) {
    const payment = await prisma.payment.findFirst({ where: { id: paymentId, user_id: userId } });
    if (!payment) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Paiement introuvable." };
    if (payment.status !== "PENDING") throw { code: ErrorCode.CONFLICT, status: 409, message: "Ce paiement n'est plus en attente." };

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data:  { status: "SUCCESS", paidAt: new Date() },
    });

    await this.subService.activate(userId, paymentId);

    return updated;
  }

  /**
   * Retourne le statut courant d'un paiement.
   *
   * @param paymentId - Identifiant du paiement
   * @param userId    - Identifiant de l'utilisateur
   */
  async getStatus(paymentId: string, userId: string) {
    const payment = await prisma.payment.findFirst({ where: { id: paymentId, user_id: userId } });
    if (!payment) throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Paiement introuvable." };
    return payment;
  }
}
```

---

## 17. Module Notifications

### Routes — `start/routes/notification.route.ts`

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { NotificationController } from "../../app/controllers/notification.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const NotificationRouter = new Hono();

NotificationRouter
  .get("/",           authMiddleware, callAction(NotificationController, "list"))
  .post("/:id/read",  authMiddleware, callAction(NotificationController, "markRead"))
  .post("/read-all",  authMiddleware, callAction(NotificationController, "markAllRead"));
```

### Service — `app/services/notification.service.ts`

```ts
import { prisma } from "../../config/database.js";

/**
 * Service de gestion des notifications in-app.
 */
export class NotificationService {

  /**
   * Crée une notification pour un utilisateur.
   * Méthode appelée par les autres services (messagerie, modération, etc.).
   *
   * @param userId - Identifiant du destinataire
   * @param data   - { title, body, type, data? }
   */
  async create(userId: string, data: { title: string; body: string; type: string; data?: Record<string, any> }) {
    return await prisma.notification.create({
      data: { user_id: userId, ...data },
    });
  }

  /**
   * Liste les notifications d'un utilisateur (non lues en premier).
   *
   * @param userId - Identifiant de l'utilisateur
   * @param page   - Numéro de page
   * @param limit  - Taille de page
   */
  async list(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where:   { user_id: userId },
        skip,
        take:    limit,
        orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      }),
      prisma.notification.count({ where: { user_id: userId } }),
    ]);
    return { notifications, total };
  }

  /**
   * Marque une notification spécifique comme lue.
   *
   * @param userId         - Identifiant de l'utilisateur
   * @param notificationId - Identifiant de la notification
   */
  async markRead(userId: string, notificationId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data:  { isRead: true },
    });
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues.
   *
   * @param userId - Identifiant de l'utilisateur
   */
  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { user_id: userId, isRead: false },
      data:  { isRead: true },
    });
  }
}
```

---

## 18. Module Announcements

### Routes — `start/routes/announcement.route.ts`

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { AnnouncementController } from "../../app/controllers/announcement.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";
import { roleMiddleware }  from "../../app/middlewares/role.middleware.js";

export const AnnouncementRouter = new Hono();

AnnouncementRouter
  .get("/",    authMiddleware, callAction(AnnouncementController, "list"))
  .post("/",   authMiddleware, roleMiddleware(["admin", "staff"]), callAction(AnnouncementController, "create"));
```

---

## 19. Module Updates

### Routes — `start/routes/updates.route.ts`

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { UpdatesController } from "../../app/controllers/updates.controller.js";

export const UpdatesRouter = new Hono();

UpdatesRouter
  .get("/output-metadata.json", callAction(UpdatesController, "metadata"));
```

### Controller — `app/controllers/updates.controller.ts`

```ts
import { HttpContext } from "../../app.js";
import { ApiResponse } from "../helpers/api-response.js";
import { env } from "../../config/envManager.js";

/**
 * Contrôleur OTA Updates.
 * Retourne les métadonnées de la version courante de l'application.
 * Appelé par l'app mobile au démarrage pour vérifier les mises à jour.
 */
export class UpdatesController {

  /**
   * GET /updates/output-metadata.json
   * Retourne : version, buildNumber, changelog, taille estimée.
   */
  async metadata(c: HttpContext) {
    return ApiResponse.success(c, {
      version:     env.get("APP_VERSION"),
      buildNumber: env.get("APP_BUILD_NUMBER"),
      changelog: [
        "Amélioration des performances de la messagerie",
        "Nouveau système de bibliothèque académique",
        "Corrections de bugs mineurs",
      ],
      size:        "8.2 MB",
      releaseDate: new Date().toISOString(),
    }, "Métadonnées récupérées.");
  }
}
```

---

## 20. Middlewares

### `app/middlewares/auth.middleware.ts`

```ts
import { Context, Next } from "hono";
import { hash } from "../../config/hash.js";
import { ApiResponse } from "../helpers/api-response.js";
import { ErrorCode } from "../helpers/error-codes.js";

/**
 * Middleware d'authentification JWT.
 * Vérifie la présence et la validité du Bearer token dans le header Authorization.
 * Injecte userId, role et plan dans le contexte Hono pour les controllers.
 *
 * @throws UNAUTHORIZED (401) si le token est absent, invalide ou expiré
 */
export async function authMiddleware(c: Context, next: Next) {
  const authorization = c.req.header("Authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return ApiResponse.error(c, ErrorCode.UNAUTHORIZED, "Token d'authentification requis.", 401);
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const payload = await hash.jwt.decode(token);

    c.set("userId",   payload.payload.sub);
    c.set("role",     payload.payload.role);
    c.set("deviceId", payload.payload.deviceId);

    await next();
  } catch {
    return ApiResponse.error(c, ErrorCode.UNAUTHORIZED, "Token invalide ou expiré.", 401);
  }
}
```

### `app/middlewares/role.middleware.ts`

```ts
import { Context, Next } from "hono";
import { ApiResponse } from "../helpers/api-response.js";
import { ErrorCode } from "../helpers/error-codes.js";

/**
 * Middleware de contrôle de rôle.
 * À utiliser après authMiddleware.
 * Autorise uniquement les rôles spécifiés à accéder à la route.
 *
 * @param allowedRoles - Tableau des rôles autorisés (ex: ['admin', 'staff'])
 * @returns            - Middleware Hono
 *
 * @throws FORBIDDEN (403) si le rôle de l'utilisateur n'est pas dans la liste
 *
 * @example
 *   .post("/folders", authMiddleware, roleMiddleware(["admin", "staff"]), callAction(...))
 */
export function roleMiddleware(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const role = c.get("role") as string;

    if (!allowedRoles.includes(role)) {
      return ApiResponse.error(c, ErrorCode.FORBIDDEN, "Vous n'avez pas les droits pour effectuer cette action.", 403);
    }

    await next();
  };
}
```

### `app/middlewares/plan.middleware.ts`

```ts
import { Context, Next } from "hono";
import { prisma } from "../../config/database.js";
import { ApiResponse } from "../helpers/api-response.js";
import { ErrorCode } from "../helpers/error-codes.js";

/**
 * Middleware de contrôle du plan d'abonnement.
 * À utiliser après authMiddleware pour les routes PREMIUM uniquement.
 * Vérifie que l'utilisateur a un abonnement PREMIUM actif.
 *
 * @throws PREMIUM_REQUIRED (402) si le plan n'est pas PREMIUM ou est expiré
 *
 * @example
 *   .get("/ai/advanced", authMiddleware, planMiddleware, callAction(...))
 */
export async function planMiddleware(c: Context, next: Next) {
  const userId = c.get("userId") as string;

  const subscription = await prisma.subscription.findUnique({ where: { user_id: userId } });

  if (!subscription || subscription.plan !== "PREMIUM" || subscription.status !== "ACTIVE") {
    return ApiResponse.error(c, ErrorCode.PREMIUM_REQUIRED, "Cette fonctionnalité nécessite un abonnement PREMIUM.", 402);
  }

  c.set("plan", "PREMIUM");
  await next();
}
```

---

## 21. Service Mail

### `app/services/mailer.service.ts`

```ts
import nodemailer from "nodemailer";
import { mailConfig } from "../../config/mail.js";
import fs from "fs";
import path from "path";

/**
 * Service d'envoi d'emails via Nodemailer + Gmail SMTP.
 * Tous les envois sont asynchrones et non-bloquants.
 * Les échecs sont loggés mais ne font jamais échouer la requête appelante.
 */
export class MailerService {
  private transporter = nodemailer.createTransport(mailConfig);

  /**
   * Envoie un email de vérification contenant l'OTP.
   *
   * @param to       - Adresse email du destinataire
   * @param otp      - Code OTP en clair (6 chiffres)
   * @param username - Nom d'utilisateur pour personnaliser l'email
   */
  async sendVerification(to: string, otp: string, username: string) {
    const html = this._loadTemplate("verification", { otp, username });
    await this._send(to, "Vérifiez votre adresse email — PipoLink", html);
  }

  /**
   * Envoie un email de réinitialisation de mot de passe.
   *
   * @param to  - Adresse email du destinataire
   * @param otp - Code OTP de reset
   */
  async sendPasswordReset(to: string, otp: string) {
    const html = this._loadTemplate("reset-password", { otp });
    await this._send(to, "Réinitialisez votre mot de passe — PipoLink", html);
  }

  /**
   * Envoie un email d'alerte de sécurité.
   *
   * @param to     - Adresse email du destinataire
   * @param action - Description de l'action (ex: 'Changement de mot de passe')
   */
  async sendSecurityAlert(to: string, action: string) {
    const html = this._loadTemplate("security-alert", { action, date: new Date().toLocaleString("fr-FR") });
    await this._send(to, "Alerte de sécurité — PipoLink", html);
  }

  /**
   * Envoie un email de rappel d'expiration d'abonnement.
   *
   * @param to        - Adresse email du destinataire
   * @param expiresAt - Date d'expiration de l'abonnement
   */
  async sendSubscriptionReminder(to: string, expiresAt: Date) {
    const html = this._loadTemplate("subscription-reminder", {
      expiresAt: expiresAt.toLocaleDateString("fr-FR"),
    });
    await this._send(to, "Votre abonnement PipoLink expire bientôt", html);
  }

  // ── Méthodes privées ──────────────────────────────────────────────────────

  /**
   * Envoie un email via le transporteur Nodemailer.
   * Catch silencieux : les échecs d'envoi ne remontent pas d'erreur.
   */
  private async _send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from:    `"${mailConfig.from.name}" <${mailConfig.from.address}>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error(`[MailerService] Échec envoi email vers ${to} :`, err);
    }
  }

  /**
   * Charge un template HTML et remplace les variables {{variable}}.
   *
   * @param name      - Nom du fichier template (sans .html)
   * @param variables - Variables à injecter dans le template
   */
  private _loadTemplate(name: string, variables: Record<string, string>): string {
    const filePath = path.join(process.cwd(), "src", "templates", `${name}.html`);
    let html = fs.readFileSync(filePath, "utf-8");

    for (const [key, value] of Object.entries(variables)) {
      html = html.replaceAll(`{{${key}}}`, value);
    }

    return html;
  }
}
```

---

## 22. Service Fichiers

### `app/services/file.service.ts`

```ts
import sharp from "sharp";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import { env } from "../../config/envManager.js";
import { ErrorCode } from "../helpers/error-codes.js";

/**
 * Service de gestion des fichiers uploadés.
 * Validation MIME, taille, extension.
 * Traitement des images via Sharp.
 * Stockage local dans le dossier STORAGE_PATH.
 */
export class FileService {

  // Extensions et MIME types autorisés par catégorie
  private readonly ALLOWED_DOCUMENTS = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  private readonly ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp"];

  /**
   * Traite et enregistre l'avatar d'un utilisateur.
   * Redimensionne en 256x256 pixels, convertit en WebP.
   *
   * @param userId - Identifiant de l'utilisateur (utilisé pour nommer le fichier)
   * @param buffer - Buffer de l'image uploadée
   * @returns      - URL relative du fichier enregistré
   */
  async processAvatar(userId: string, buffer: Buffer): Promise<string> {
    const outputPath = this._ensureDir("avatars");
    const fileName   = `${userId}.webp`;
    const filePath   = path.join(outputPath, fileName);

    await sharp(buffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(filePath);

    return `/storage/avatars/${fileName}`;
  }

  /**
   * Valide et enregistre un document académique.
   * Vérifie le type MIME, la taille maximale.
   *
   * @param buffer       - Buffer du fichier
   * @param originalName - Nom original du fichier
   * @param mimeType     - Type MIME déclaré par le client
   * @returns            - { url, size }
   * @throws             - INVALID_FILE_TYPE, FILE_TOO_LARGE
   */
  async storeDocument(buffer: Buffer, originalName: string, mimeType: string): Promise<{ url: string; size: number }> {
    this._validateMime(mimeType, [...this.ALLOWED_DOCUMENTS, ...this.ALLOWED_IMAGES]);
    this._validateSize(buffer.length, env.get("MAX_FILE_SIZE_MB") * 1024 * 1024);

    const ext      = mime.extension(mimeType) || "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const dir      = this._ensureDir("documents");
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, buffer);

    return { url: `/storage/documents/${fileName}`, size: buffer.length };
  }

  // ── Méthodes privées ──────────────────────────────────────────────────────

  /**
   * Vérifie que le type MIME est dans la liste blanche.
   *
   * @throws FILE_INVALID_TYPE (422) si non autorisé
   */
  private _validateMime(mimeType: string, allowed: string[]) {
    if (!allowed.includes(mimeType)) {
      throw { code: ErrorCode.INVALID_FILE_TYPE, status: 422, message: `Type de fichier non autorisé : ${mimeType}` };
    }
  }

  /**
   * Vérifie que la taille du fichier ne dépasse pas le maximum autorisé.
   *
   * @throws FILE_TOO_LARGE (413) si dépassement
   */
  private _validateSize(sizeBytes: number, maxBytes: number) {
    if (sizeBytes > maxBytes) {
      throw { code: ErrorCode.FILE_TOO_LARGE, status: 413, message: `Fichier trop volumineux. Maximum : ${maxBytes / 1024 / 1024} MB.` };
    }
  }

  /**
   * Crée le répertoire de stockage si inexistant et retourne son chemin.
   *
   * @param subDir - Sous-répertoire dans STORAGE_PATH
   */
  private _ensureDir(subDir: string): string {
    const dir = path.join(env.get("STORAGE_PATH"), subDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
}
```

---

## 23. Format des réponses API

```json
// Succès simple
{
  "success": true,
  "message": "Connexion réussie",
  "data": { "accessToken": "eyJ..." },
  "meta": { "timestamp": "2026-05-10T09:00:00.000Z" }
}

// Succès paginé
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1, "limit": 20, "total": 147,
    "totalPages": 8, "hasNext": true, "hasPrev": false
  }
}

// Erreur métier
{
  "success": false,
  "error": "INVALID_OTP",
  "message": "Code OTP incorrect ou expiré.",
  "details": { "attemptsRemaining": 3 },
  "meta": { "timestamp": "2026-05-10T09:00:00.000Z" }
}
```

---

## 24. Conventions & règles absolues

### Règles de code

```
INTERDIT :
  ✗  Logique métier dans un controller
  ✗  Appel Prisma direct dans un controller
  ✗  Utilisation de `any` en TypeScript
  ✗  c.json() directement dans un controller → toujours ApiResponse
  ✗  Chaînes d'erreur en dur → toujours ErrorCode.*
  ✗  Secrets en dur → toujours env.get("...")
  ✗  try/catch silencieux sans console.error dans les services

OBLIGATOIRE :
  ✓  JSDoc en français sur toutes les méthodes publiques
  ✓  Validation VineJS sur tous les corps de requête
  ✓  Réponses via ApiResponse uniquement
  ✓  Audit log sur les actions sensibles (LOGIN, DEVICE_LINKED, etc.)
  ✓  Soft delete (is_excluded / revokedAt / deletedAt) sur les entités critiques
```

### Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Fichiers | kebab-case | `auth.service.ts` |
| Classes | PascalCase | `class AuthService` |
| Méthodes | camelCase | `verifyOtp()` |
| Variables Prisma | snake_case (champs Prisma) | `user_id`, `created_at` |
| Constantes | SCREAMING_SNAKE | `ErrorCode.INVALID_OTP` |
| Routes | kebab-case | `/forgot-password` |

---

## 25. Checklist de génération

### Infrastructure

- [ ] `start/env.ts` — schéma complet avec toutes les variables
- [ ] `config/envManager.ts` — EnvManager fonctionnel
- [ ] `config/database.ts` — PrismaClient PostgreSQL (sans adapter MariaDB)
- [ ] `config/hash.ts` — HashHelpers (bcrypt, SHA-512, JWT HS256)
- [ ] `config/cors.ts` — configuration CORS
- [ ] `config/mail.ts` — configuration Nodemailer Gmail
- [ ] `app.ts` — HttpContext, callAction, validateData (fourni, ne pas modifier)
- [ ] `server.ts` — démarrage avec vérification DB
- [ ] `start/kernel.ts` — router principal avec tous les modules montés
- [ ] `app/helpers/api-response.ts` — helper réponses standardisées
- [ ] `app/helpers/error-codes.ts` — constantes codes d'erreur

### Schéma Prisma

- [ ] Schéma fourni intégré tel quel
- [ ] Ajouts : `QrToken`, `MessageType` enum, `deletedAt` sur Message
- [ ] Migration initiale générée (`prisma migrate dev --name init`)
- [ ] Seed avec données de test réalistes (`prisma/seed.ts`)

### Modules (pour chaque module : route + validator + controller + service)

- [ ] Module **Auth** (register, verify-otp, login, refresh, logout, change-password, QR)
- [ ] Module **Users** (me, onboarding, update, avatar, delete)
- [ ] Module **Devices** (list, revoke)
- [ ] Module **Messaging** (conversations, messages, send, upload, read)
- [ ] Module **Library** (dossiers + documents, upload, download, search, modération)
- [ ] Module **AI** (chat, sessions, clear)
- [ ] Module **Subscriptions** (get, activate, expire-cron)
- [ ] Module **Payments** (initiate, status, webhook, confirm-simulated)
- [ ] Module **Notifications** (list, mark-read, mark-all-read)
- [ ] Module **Announcements** (list, create)
- [ ] Module **Updates** (metadata)

### Services transversaux

- [ ] `OtpService` (génération, vérification, cooldown, nettoyage)
- [ ] `MailerService` (4 templates HTML : verification, reset, security-alert, reminder)
- [ ] `FileService` (avatar Sharp, documents, validation MIME + taille)

### Middlewares

- [ ] `authMiddleware` — JWT decode, inject userId + role
- [ ] `roleMiddleware` — contrôle rôle (admin, staff, student)
- [ ] `planMiddleware` — contrôle abonnement PREMIUM

### Templates email

- [ ] `templates/verification.html` — OTP vérification email
- [ ] `templates/reset-password.html` — OTP reset mot de passe
- [ ] `templates/security-alert.html` — alerte sécurité
- [ ] `templates/subscription-reminder.html` — rappel expiration

### Qualité

- [ ] TypeScript strict : zéro `any`, zéro erreur compilation
- [ ] Toutes les réponses via `ApiResponse`
- [ ] Tous les codes d'erreur via `ErrorCode`
- [ ] JSDoc en français sur toutes les méthodes publiques de services
- [ ] Audit log sur : LOGIN, LOGOUT, PASSWORD_CHANGED, DEVICE_LINKED, DEVICE_REVOKED, DOCUMENT_UPLOADED, DOCUMENT_DELETED, SUBSCRIPTION_ACTIVATED, SUBSCRIPTION_EXPIRED, ACCOUNT_DELETED