import vine from "@vinejs/vine";

export const createUpdateValidator = vine.compile(
  vine.object({
    version: vine.string().regex(/^\d+\.\d+(\.\d+)?$/),
    changelog: vine.array(vine.string().minLength(1)).minLength(1),
    isRequired: vine.boolean(),
    minSdkVersion: vine.string().minLength(1),
    severity: vine.enum(['low', 'medium', 'high', 'critical'] as const),
    type: vine.enum(['auto', 'manual'] as const),
    links: vine.array(
      vine.object({
        platform: vine.enum(['android', 'ios'] as const),
        link: vine.string().url(),
      })
    ).optional(),
  })
);
