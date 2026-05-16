import { z } from 'zod';

export const NIVEAUX = ['1', '2', '3', '4', '5'] as const;

export const onboardingSchema = z.object({
  firstname: z.string().trim().min(2, 'Prénom requis (2 caractères min.)'),
  lastname: z.string().trim().min(2, 'Nom requis (2 caractères min.)'),
  username: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[a-zA-Z0-9_]{3,24}$/.test(v), 'Pseudo invalide (3–24 caractères)'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^\+\d{8,15}$/.test(v.replace(/\s/g, '')), 'Numéro invalide'),
  niveau: z.enum(NIVEAUX).optional(),
  filiere: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.length >= 2, 'Filière trop courte'),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
