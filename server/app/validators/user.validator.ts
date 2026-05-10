import vine from "@vinejs/vine";

export const onboardingValidator = vine.compile(
  vine.object({
    firstname: vine.string().minLength(2).maxLength(100),
    lastname:  vine.string().minLength(2).maxLength(100),
    username:  vine.string().minLength(3).maxLength(30).optional(),
    phone:     vine.string().optional(),
    gender:    vine.enum(["M", "F", "OTHER"]).optional(),
    matricule: vine.string().optional(),
    niveau:    vine.string().optional(),
    filiere:   vine.string().optional(),
  })
);

export const updateProfileValidator = vine.compile(
  vine.object({
    firstname: vine.string().minLength(2).optional(),
    lastname:  vine.string().minLength(2).optional(),
    username:  vine.string().minLength(3).optional(),
    phone:     vine.string().optional(),
    bio:       vine.string().maxLength(500).optional(),
  })
);
