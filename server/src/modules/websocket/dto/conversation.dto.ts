import vine from "@vinejs/vine";

export const conversationCreateValidator = vine.compile(
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
