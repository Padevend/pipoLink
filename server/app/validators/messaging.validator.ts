import vine from "@vinejs/vine";

/**
 * Validateur d'envoi de message texte.
 * Le contenu est chiffré côté client — le backend ne le lit pas.
 */
export const sendMessageValidator = vine.compile(
  vine.object({
    content: vine.string().minLength(1),
    iv:      vine.string().minLength(1),
    type:    vine.enum(["TEXT", "IMAGE", "DOCUMENT", "MIXED", "SYSTEM"]).optional(),
    replyToId: vine.string().uuid().optional(),
    attachments: vine
      .array(
        vine.object({
          fileUrl:   vine.string(),
          iv:        vine.string(),
          fileName:  vine.string(),
          fileSize:  vine.number(),
          mimeType:  vine.string(),
        }),
      )
      .optional(),
  })
);

export const createChatValidator = vine.compile(
  vine.object({
    name:           vine.string().maxLength(200).optional(),
    type:           vine.enum(["private", "group"]),
    memberUserIds:  vine.array(vine.string().uuid()).minLength(1),
    encryptedKeys:  vine
      .array(
        vine.object({
          deviceId:     vine.string().uuid(),
          encryptedKey: vine.string().minLength(1),
        }),
      )
      .minLength(1),
  })
);

export const addChatMemberValidator = vine.compile(
  vine.object({
    userId:        vine.string().uuid(),
    encryptedKeys: vine
      .array(
        vine.object({
          deviceId:     vine.string().uuid(),
          encryptedKey: vine.string().minLength(1),
        }),
      )
      .minLength(1),
  })
);
