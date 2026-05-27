import { z } from 'zod';

export const deleteAccountSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'adresse email est requise.')
    .email('Veuillez entrer une adresse email valide.'),
});

export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;
