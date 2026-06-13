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
    email:              vine.string().email().normalizeEmail(),
    password:           vine.string().minLength(1),
    deviceFingerprint:  vine.string().minLength(4).maxLength(200).optional(),
    deviceName:         vine.string().maxLength(120).optional(),
    devicePlatform:     vine.string().maxLength(40).optional(),
    /** primary = connexion appareil principal ; device = connexion appareil déjà associé */
    loginMode:          vine.enum(["primary", "device"]).optional(),
    fcmToken:           vine.string().optional(),
  })
);

export const initiatePairingValidator = vine.compile(
  vine.object({
    deviceName:    vine.string().minLength(1).maxLength(120),
    platform:      vine.string().minLength(1).maxLength(40),
    fingerprint:   vine.string().minLength(4).maxLength(200),
    publicKey:     vine.string().minLength(32),
    keySignature:  vine.string().minLength(32),
  })
);

export const approvePairingValidator = vine.compile(
  vine.object({
    token:     vine.string().minLength(8).optional(),
    shortCode: vine.string().minLength(4).maxLength(8).optional(),
    chatKeyBundle: vine
      .array(
        vine.object({
          chatId:       vine.string().uuid(),
          encryptedKey: vine.string().minLength(1),
        }),
      )
      .optional(),
  })
);

/**
 * Validateur de vérification OTP.
 * purpose : 'EMAIL_VERIFY' | 'PASSWORD_RESET'
 */
export const verifyOtpValidator = vine.compile(
  vine.object({
    email:   vine.string().email().normalizeEmail(),
    code:    vine.string().fixedLength(6),
    purpose: vine.enum(["EMAIL_VERIFY", "PASSWORD_RESET"]),
  })
);

/**
 * Validateur de renvoi d'OTP.
 */
export const resendOtpValidator = vine.compile(
  vine.object({
    email:   vine.string().email().normalizeEmail(),
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
    email:       vine.string().email().normalizeEmail(),
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
