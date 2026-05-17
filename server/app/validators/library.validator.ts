import vine from "@vinejs/vine";

/**
 * Validateur d'upload de document académique.
 */
export const uploadDocumentValidator = vine.compile(
  vine.object({
    title:       vine.string().minLength(3).maxLength(255),
    description: vine.string().optional(),
    filiere:     vine.string().minLength(1),
    niveau:      vine.string().minLength(1),
    ue:          vine.string().minLength(1),
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

/**
 * Validateur de mise a jour d'un document (metadonnees uniquement).
 */
export const updateDocumentValidator = vine.compile(
  vine.object({
    title:       vine.string().minLength(3).maxLength(255).optional(),
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
