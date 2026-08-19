import { z } from 'zod';

export const deleteAccountSchema = z.object({
  email: z.string().email('Veuillez entrer une adresse e-mail valide.'),
});

export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;
