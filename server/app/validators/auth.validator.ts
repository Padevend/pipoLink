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
