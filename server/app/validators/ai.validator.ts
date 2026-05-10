import vine from "@vinejs/vine";

export const chatValidator = vine.compile(
  vine.object({
    message: vine.string().minLength(1),
    sessionId: vine.string().uuid().optional(),
  })
);
