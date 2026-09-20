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

  // ── Storage SDK Driver ─────────────────────────────────
  STORAGE_SDK_DRIVER: vine.enum(["local", "google-drive", "r2", "gcs"]).optional(),

  // ── Cloudflare R2 ─────────────────────────────────────
  R2_ACCOUNT_ID: vine.string().optional(),
  R2_ACCESS_KEY_ID: vine.string().optional(),
  R2_SECRET_ACCESS_KEY: vine.string().optional(),
  R2_BUCKET_NAME: vine.string().optional(),
  R2_PUBLIC_URL: vine.string().optional(),

  // ── Google Cloud Storage ──────────────────────────────
  GCS_BUCKET_NAME: vine.string().optional(),
  GCS_PROJECT_ID: vine.string().optional(),
  GCS_KEY_FILE_PATH: vine.string().optional(),

  // GOOGLE AUTH
  GOOGLE_CLIENT_ID: vine.string().optional(),
  GOOGLE_CLIENT_SECRET: vine.string().optional(),
  GOOGLE_REDIRECT_URI: vine.string().optional(),
  GOOGLE_REFRESH_TOKEN: vine.string().optional(),
  GOOGLE_ANDROID_CLIENT_ID: vine.string().optional(),
  GOOGLE_IOS_CLIENT_ID: vine.string().optional(),
  GOOGLE_WEB_CLIENT_ID: vine.string().optional(),

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
