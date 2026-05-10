import vine from "@vinejs/vine";

export const announcementValidator = vine.compile(
  vine.object({
    title: vine.string().minLength(3),
    content: vine.string().minLength(10),
  })
);
