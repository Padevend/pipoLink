import vine from "@vinejs/vine";

export const paymentInitiateValidator = vine.compile(
  vine.object({
    amount: vine.number().min(1),
    provider: vine.string().minLength(1),
  })
);
