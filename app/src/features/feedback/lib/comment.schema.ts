import { z } from 'zod';

export const FEEDBACK_REASONS = [
  { label: 'Suggestion d\'amélioration', value: 'suggestion' },
  { label: 'Signalement de bug', value: 'bug' },
  { label: 'Question générale', value: 'question' },
  { label: 'Demande de fonctionnalité', value: 'feature' },
  { label: 'Autre', value: 'other' },
] as const;

export const commentSchema = z.object({
  subject: z.string().min(1, 'Veuillez sélectionner un motif.'),
  message: z
    .string()
    .min(10, 'Le message doit contenir au moins 10 caractères.')
    .max(2000, 'Le message ne peut pas dépasser 2000 caractères.'),
});

export type CommentFormValues = z.infer<typeof commentSchema>;
