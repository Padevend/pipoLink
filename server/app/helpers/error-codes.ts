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
  ACCOUNT_ALREADY_DELETED: "ACCOUNT_ALREADY_DELETED",
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
  ONBOARDING_REQUIRED:   "ONBOARDING_REQUIRED",
  INVALID_DEVICE_KEY:    "INVALID_DEVICE_KEY",
  DEVICE_KEY_REQUIRED:   "DEVICE_KEY_REQUIRED",
  DEVICE_NOT_REGISTERED: "DEVICE_NOT_REGISTERED",
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];
