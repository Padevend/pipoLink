import vine from "@vinejs/vine";

export const onboardingValidator = vine.compile(
  vine.object({
    firstname:            vine.string().minLength(2).maxLength(100),
    lastname:             vine.string().minLength(2).maxLength(100),
    username:             vine.string().minLength(3).maxLength(30).optional(),
    phone:                vine.string().optional(),
    gender:               vine.enum(["M", "F", "OTHER"]).optional(),
    matricule:            vine.string().optional(),
    niveau:               vine.string().optional(),
    filiere:              vine.string().optional(),
    deviceName:           vine.string().minLength(1).maxLength(120),
    devicePlatform:       vine.string().minLength(1).maxLength(40),
    deviceFingerprint:    vine.string().minLength(4).maxLength(200),
    devicePublicKey:      vine.string().minLength(32).maxLength(120),
    deviceKeySignature:   vine.string().minLength(32).maxLength(200),
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
