# PipoLink Backend — Prompt de génération complète
> À coller dans le chat pour accompagner le modèle dans la génération fichier par fichier.

---

## Contexte & mission

Tu es un architecte backend senior. Tu vas générer le backend complet de **PipoLink**, une plateforme étudiante, fichier par fichier, de manière méthodique et sans jamais tronquer le code.

L'`agent.md` ci-joint contient la spécification complète du projet. Tu dois t'y référer à chaque étape comme source de vérité absolue.

---

## Stack (rappel strict)

```
Runtime    : Node.js + TypeScript strict (zéro `any`)
Framework  : Hono + @hono/node-server
ORM        : Prisma (PostgreSQL)
Validation : @vinejs/vine
Sécurité   : bcrypt, node:crypto, JWT via hono/utils/jwt
Email      : nodemailer (Gmail SMTP)
Images     : sharp
Utilitaires: luxon, mime-types, dotenv
```

---

## Fichiers de base fournis (ne pas réécrire)

Ces fichiers sont déjà écrits et fonctionnels. Tu peux les importer librement mais **ne les modifie jamais** :

| Fichier | Rôle |
|---|---|
| `app.ts` | `HttpContext`, `callAction`, `validateData`, `ValidationException` |
| `config/hash.ts` | `hash.make()`, `hash.compare()`, `hash.sha512()`, `hash.jwt.*`, `hash.generateRandomString()` |
| `config/envManager.ts` | `env.get("KEY")` — accès aux variables d'environnement |
| `start/env.ts` | Schéma de validation des variables d'environnement |

---

## Patterns obligatoires

### Route

```ts
import { Hono } from "hono";
import { callAction } from "../../app.js";
import { MonController } from "../../app/controllers/mon.controller.js";
import { authMiddleware } from "../../app/middlewares/auth.middleware.js";

export const MonRouter = new Hono();

MonRouter
  .get("/",    authMiddleware, callAction(MonController, "list"))
  .post("/",   authMiddleware, callAction(MonController, "create"));
```

### Controller

```ts
import { HttpContext } from "../../app.js";
import { MonService } from "../services/mon.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { monValidator } from "../validators/mon.validator.js";

export class MonController {
  private service = new MonService();

  /**
   * Description de l'action en français.
   */
  async create(c: HttpContext) {
    const payload = await c.validateUsing(monValidator);
    const result  = await this.service.create(payload);
    return ApiResponse.success(c, result, "Ressource créée.", 201);
  }
}
```

### Service

```ts
import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";

export class MonService {

  /**
   * Description complète en français.
   * @param payload - Données validées
   * @returns       - Résultat
   * @throws        - Code d'erreur si applicable
   */
  async create(payload: any) {
    // logique métier ici
  }
}
```

### Validator

```ts
import vine from "@vinejs/vine";

/**
 * Description du validateur en français.
 */
export const monValidator = vine.compile(
  vine.object({
    champ: vine.string().minLength(1),
  })
);
```

### Réponses

```ts
// Toujours utiliser ApiResponse — jamais c.json() directement
ApiResponse.success(c, data, "Message", 200)
ApiResponse.paginated(c, data, total, page, limit)
ApiResponse.error(c, ErrorCode.NOT_FOUND, "Message", 404)
```

### Erreurs

```ts
// Toujours lever une erreur structurée — jamais throw new Error()
throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Ressource introuvable." };
```

### Variables d'environnement

```ts
import { env } from "../../config/envManager.js";
env.get("JWT_SECRET"); // toujours via env.get()
```

---

## Règles absolues de génération

```
✗  Jamais de logique métier dans un controller
✗  Jamais d'appel Prisma dans un controller
✗  Jamais de `any` en TypeScript
✗  Jamais de c.json() directement dans un controller
✗  Jamais de chaîne d'erreur en dur → toujours ErrorCode.*
✗  Jamais de code tronqué ou commentaire "// ... reste du code"
✗  Jamais de TODO sans implémentation

✓  JSDoc en français sur toutes les méthodes publiques des services
✓  Un fichier = un seul rôle (SRP strict)
✓  Imports avec .js à la fin (ESM)
✓  Code complet et immédiatement exécutable
```

---

## Ordre de génération

Génère dans cet ordre exact. Attends ma confirmation ("ok", "continuer", "suite")
entre chaque étape avant de passer à la suivante.

**Étape 0 — Infrastructure**
- [ ] `start/env.ts`
- [ ] `config/database.ts`
- [ ] `config/cors.ts`
- [ ] `config/mail.ts`
- [ ] `server.ts`
- [ ] `start/kernel.ts`
- [ ] `app/helpers/api-response.ts`
- [ ] `app/helpers/error-codes.ts`
- [ ] `.env.example`

**Étape 1 — Schéma Prisma**
- [ ] `prisma/schema.prisma` (schéma complet avec les ajouts QrToken, MessageType, deletedAt)
- [ ] `prisma/seed.ts`

**Étape 2 — Middlewares**
- [ ] `app/middlewares/auth.middleware.ts`
- [ ] `app/middlewares/role.middleware.ts`
- [ ] `app/middlewares/plan.middleware.ts`

**Étape 3 — Services transversaux**
- [ ] `app/services/otp.service.ts`
- [ ] `app/services/mailer.service.ts`
- [ ] `app/services/file.service.ts`

**Étape 4 — Templates email**
- [ ] `src/templates/verification.html`
- [ ] `src/templates/reset-password.html`
- [ ] `src/templates/security-alert.html`
- [ ] `src/templates/subscription-reminder.html`

**Étape 5 — Module Auth**
- [ ] `app/validators/auth.validator.ts`
- [ ] `app/services/auth.service.ts`
- [ ] `app/controllers/auth.controller.ts`
- [ ] `start/routes/auth.route.ts`

**Étape 6 — Module Users**
- [ ] `app/validators/user.validator.ts`
- [ ] `app/services/user.service.ts`
- [ ] `app/controllers/user.controller.ts`
- [ ] `start/routes/user.route.ts`

**Étape 7 — Module Devices**
- [ ] `app/validators/device.validator.ts`
- [ ] `app/services/device.service.ts`
- [ ] `app/controllers/device.controller.ts`
- [ ] `start/routes/device.route.ts`

**Étape 8 — Module Messaging**
- [ ] `app/validators/messaging.validator.ts`
- [ ] `app/services/messaging.service.ts`
- [ ] `app/controllers/messaging.controller.ts`
- [ ] `start/routes/messaging.route.ts`

**Étape 9 — Module Library**
- [ ] `app/validators/library.validator.ts`
- [ ] `app/services/folder.service.ts`
- [ ] `app/services/library.service.ts`
- [ ] `app/controllers/folder.controller.ts`
- [ ] `app/controllers/library.controller.ts`
- [ ] `start/routes/library.route.ts`

**Étape 10 — Module AI**
- [ ] `app/validators/ai.validator.ts`
- [ ] `app/services/ai.service.ts`
- [ ] `app/controllers/ai.controller.ts`
- [ ] `start/routes/ai.route.ts`

**Étape 11 — Module Subscriptions**
- [ ] `app/validators/subscription.validator.ts`
- [ ] `app/services/subscription.service.ts`
- [ ] `app/controllers/subscription.controller.ts`
- [ ] `start/routes/subscription.route.ts`

**Étape 12 — Module Payments**
- [ ] `app/validators/payment.validator.ts`
- [ ] `app/services/payment.service.ts`
- [ ] `app/controllers/payment.controller.ts`
- [ ] `start/routes/payment.route.ts`

**Étape 13 — Module Notifications**
- [ ] `app/services/notification.service.ts`
- [ ] `app/controllers/notification.controller.ts`
- [ ] `start/routes/notification.route.ts`

**Étape 14 — Module Announcements**
- [ ] `app/validators/announcement.validator.ts`
- [ ] `app/services/announcement.service.ts`
- [ ] `app/controllers/announcement.controller.ts`
- [ ] `start/routes/announcement.route.ts`

**Étape 15 — Module Updates**
- [ ] `app/controllers/updates.controller.ts`
- [ ] `start/routes/updates.route.ts`

**Étape 16 — Configuration projet**
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `.gitignore`
- [ ] `README.md`

---

## Consignes de génération par étape

Pour chaque fichier généré :

1. **Annonce** le fichier avec son chemin complet : `### \`app/services/auth.service.ts\``
2. **Génère** le fichier complet dans un bloc de code (jamais tronqué)
3. **Ajoute** une ligne de synthèse après : ce que le fichier fait et ses dépendances clés
4. **Attends** ma confirmation avant de passer au fichier suivant

Si un fichier dépend d'un autre pas encore généré, génère d'abord la dépendance ou utilise un import avec commentaire `// sera généré à l'étape X`.

---

## Comportement attendu en cas de problème

### Si un import est circulaire
→ Extraire la logique commune dans un fichier `app/helpers/` dédié.
→ Ne jamais contourner en mettant la logique dans le controller.

### Si un type Prisma n'existe pas encore
→ Utiliser le type brut en attendant (`string`, `Record<string, any>`)
→ Ajouter un commentaire `// TODO: typer avec PrismaType après génération du schéma`
→ Ne jamais utiliser `any` comme solution de contournement.

### Si un service devient trop long (> 200 lignes)
→ Le découper en sous-services privés dans le même fichier.
→ Ou extraire dans un fichier `app/services/<module>/<sous-module>.service.ts`.
→ Signaler le découpage avec un commentaire explicite.

### Si une fonctionnalité n'est pas couverte par l'agent.md
→ L'implémenter selon les conventions établies (même pattern, même style).
→ Le signaler en fin de fichier : `// Note : fonctionnalité inférée — non spécifiée dans agent.md`.

---

## Vérifications automatiques à chaque fichier

Avant de soumettre chaque fichier, vérifie mentalement :

```
□  Aucun `any` dans le fichier
□  Aucun appel Prisma dans un controller
□  Aucune logique métier dans un controller
□  Tous les imports se terminent par .js (ESM)
□  Toutes les méthodes publiques du service ont un JSDoc en français
□  Toutes les erreurs utilisent ErrorCode.* et la structure { code, status, message }
□  Toutes les réponses passent par ApiResponse
□  Le fichier est complet — aucune ligne tronquée
```

---

## Démarrage

Commence par l'**Étape 0 — Infrastructure**, fichier par fichier.

Pour le premier fichier, commence directement par `start/env.ts`.

N'anticipe pas les étapes suivantes.
Attends mon "ok" ou "continuer" entre chaque fichier.