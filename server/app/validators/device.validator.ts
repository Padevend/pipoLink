import vine from "@vinejs/vine";

export const rotateDeviceKeysValidator = vine.compile(
  vine.object({
    newPublicKey:   vine.string().minLength(32).maxLength(120),
    keySignature:   vine.string().minLength(32).maxLength(200),
    chatKeyBundle:  vine
      .array(
        vine.object({
          chatId:       vine.string().uuid(),
          encryptedKey: vine.string().minLength(1),
        }),
      )
      .minLength(1),
  })
);
