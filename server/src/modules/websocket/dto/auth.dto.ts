import vine from "@vinejs/vine";

export const authInitValidator = vine.compile(
  vine.object({
    token: vine.string().minLength(1),
    deviceId: vine.string().uuid().optional(),
    clientId: vine.string().minLength(1).optional(),
    lastEventId: vine.string().optional(),
  })
);

export const authRefreshValidator = vine.compile(
  vine.object({
    token: vine.string().minLength(1),
  })
);

export const syncResumeValidator = vine.compile(
  vine.object({
    lastEventId: vine.string().optional(),
  })
);
