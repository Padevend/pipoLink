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

export const createConversationValidator = vine.compile(
  vine.object({
    memberIds: vine.array(vine.string().uuid()).minLength(1),
  })
);
