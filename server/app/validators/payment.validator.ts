import vine from "@vinejs/vine";

export const paymentInitiateValidator = vine.compile(
  vine.object({
    // Montant ignoré côté serveur (prix fixe) — accepté pour compat anciens clients
    amount: vine.number().min(1).optional(),
    provider: vine.string().minLength(1),
    phone: vine.string().minLength(9).maxLength(15),
  })
);
