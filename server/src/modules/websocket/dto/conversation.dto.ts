import vine from "@vinejs/vine";

export const conversationCreateValidator = vine.compile(
  vine.object({
    memberIds: vine.array(vine.string().uuid()).minLength(1),
  })
);
