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
  DATABASE_CA_PATH: vine.string(),

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
  GOOGLE_DRIVE_CREDENTIALS_PATH: vine.string().optional(),
  GOOGLE_DRIVE_FOLDER_ID: vine.string().optional(),
  GOOGLE_DRIVE_AI_FOLDER_ID: vine.string().optional(),

  // GOOGLE AUTH
  GOOGLE_CLIENT_ID: vine.string(),
  GOOGLE_CLIENT_SECRET: vine.string(),
  GOOGLE_REDIRECT_URI: vine.string(),
  GOOGLE_REFRESH_TOKEN: vine.string(),

  // ── Redis ───────────────────────────────────────────
  REDIS_URL: vine.string().optional(),

  // ── MeSomb ──────────────────────────────────────────
  MESOMB_APP_KEY: vine.string(),
  MESOMB_ACCESS_KEY: vine.string(),
  MESOMB_SECRET_KEY: vine.string(),

  // ── OTA Updates ──────────────────────────────────────
  APP_VERSION:       vine.string(),
  APP_BUILD_NUMBER:  vine.number(),

  // ── RAG Agent ────────────────────────────────────────
  RAG_AGENT_API_URL: vine.string().optional(),
  RAG_API_KEY: vine.string().optional(),
};

export default EnvSchema;
