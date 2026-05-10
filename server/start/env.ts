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
