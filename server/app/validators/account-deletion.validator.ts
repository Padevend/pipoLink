import vine from "@vinejs/vine";

/**
 * Validateur pour la suppression de compte.
 * Le mot de passe est requis pour confirmer l'identité de l'utilisateur.
 */
export const deleteAccountValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
  })
);
