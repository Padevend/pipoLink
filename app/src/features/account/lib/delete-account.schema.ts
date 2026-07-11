import { z } from 'zod';

export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, 'Le mot de passe est requis pour confirmer la suppression.'),
});

export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;
