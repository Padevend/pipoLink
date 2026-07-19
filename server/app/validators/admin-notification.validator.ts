import vine from "@vinejs/vine";

export const adminNotificationValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(120),
    body: vine.string().trim().minLength(1).maxLength(500),
  })
);
