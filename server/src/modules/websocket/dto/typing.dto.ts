import vine from "@vinejs/vine";

export const typingValidator = vine.compile(
  vine.object({
    conversationId: vine.string().uuid(),
  })
);
