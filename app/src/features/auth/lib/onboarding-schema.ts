import { z } from 'zod';

import type { GenderId } from '@/shared/ui/gender-picker';

export const NIVEAUX = ['1', '2', '3', '4', '5'] as const;

export const onboardingSchema = z.object({
  firstname: z.string().trim().min(2, 'Prénom requis (2 caractères min.)'),
  lastname: z.string().trim().min(2, 'Nom requis (2 caractères min.)'),
  username: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^(?! )[^\s]{1,30}(?! )$/u.test(v), 'Pseudo invalide (3–32 caractères)'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^\+\d{8,15}$/.test(v.replace(/\s/g, '')), 'Numéro invalide'),
  gender: z.enum(['M', 'F', 'I']).optional(),
  niveau: z.enum(NIVEAUX).optional(),
  filiere: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.length >= 2, 'Filière trop courte'),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio trop longue (500 caractères max.)')
    .optional(),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema> & {
  gender?: GenderId;
};
