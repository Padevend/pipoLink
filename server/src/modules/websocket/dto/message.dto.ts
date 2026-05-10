import vine from "@vinejs/vine";

export const messageSendValidator = vine.compile(
  vine.object({
    conversationId: vine.string().uuid(),
    content: vine.string().minLength(1),
    iv: vine.string().minLength(1),
    type: vine.enum(["TEXT", "IMAGE", "DOCUMENT", "SYSTEM"]).optional(),
  })
);

export const messageUpdateValidator = vine.compile(
  vine.object({
    messageId: vine.string().uuid(),
    content: vine.string().minLength(1),
    iv: vine.string().minLength(1),
  })
);

export const messageDeleteValidator = vine.compile(
  vine.object({
    messageId: vine.string().uuid(),
  })
);

export const messageDeliveredValidator = vine.compile(
  vine.object({
    messageId: vine.string().uuid(),
  })
);

export const messageReadValidator = vine.compile(
  vine.object({
    conversationId: vine.string().uuid(),
    messageId: vine.string().uuid().optional(),
  })
);
