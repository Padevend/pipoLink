/**
 * Source unique de vérité pour la tarification et les quotas des Jetons PipoLink.
 * Aucune valeur ne doit être dupliquée ailleurs dans la codebase.
 */

export const PIPOLINK_OPERATION_COSTS = {
  // Chat / Question simple
  QUESTION_IA: 5,
  CHAT: 5,

  // Outils d'étude
  SUMMARY: 15,
  FAQ: 15,
  TIMELINE: 15,
  COMPARISON: 15,
  FLASHCARDS: 20,
  QUIZ: 25,

  // Fonctionnalités avancées
  REVISION_COMPLETE: 35,
  EXAM_PREP: 50,
  NOTEBOOK_ANALYSIS: 60,
} as const;

export type PipoLinkOperationType = keyof typeof PIPOLINK_OPERATION_COSTS;

export const PIPOLINK_PLANS = {
  FREE: {
    maxTokens: 300,       // 300 Jetons PipoLink toutes les 2 heures
    windowDays: 2 / 24,   // 2 heures
    windowMs: 2 * 60 * 60 * 1000, // 2 heures
  },
  PREMIUM: {
    maxTokens: 2000,      // 2000 Jetons PipoLink toutes les heures
    windowDays: 1 / 24,   // 1 heure
    windowMs: 1 * 60 * 60 * 1000, // 1 heure
  },
} as const;

export type PipoLinkPlanType = keyof typeof PIPOLINK_PLANS;
