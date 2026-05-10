import vine from "@vinejs/vine";

export const presenceValidator = vine.compile(
  vine.object({
    status: vine.enum(["online", "offline", "away"]),
  })
);
