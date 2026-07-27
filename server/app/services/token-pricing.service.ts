import { PIPOLINK_OPERATION_COSTS, PipoLinkOperationType } from "../config/pipolink-pricing.config.js";

export class TokenPricingService {
  /**
   * Retourne le coût fixe en Jetons PipoLink pour un type d'opération donné.
   *
   * @param operation - Nom ou code de l'opération (chat, quiz, summary, etc.)
   */
  getOperationCost(operation: string): number {
    const key = operation.trim().toUpperCase() as PipoLinkOperationType;

    if (key in PIPOLINK_OPERATION_COSTS) {
      return PIPOLINK_OPERATION_COSTS[key];
    }

    // Mappages par défaut pour les alias d'outils d'étude
    switch (operation.toLowerCase()) {
      case "chat":
      case "question":
        return PIPOLINK_OPERATION_COSTS.QUESTION_IA;
      case "summary":
      case "résumé":
      case "resume":
        return PIPOLINK_OPERATION_COSTS.SUMMARY;
      case "faq":
        return PIPOLINK_OPERATION_COSTS.FAQ;
      case "timeline":
      case "chronologie":
        return PIPOLINK_OPERATION_COSTS.TIMELINE;
      case "comparison":
      case "comparaison":
        return PIPOLINK_OPERATION_COSTS.COMPARISON;
      case "flashcards":
      case "flashcard":
        return PIPOLINK_OPERATION_COSTS.FLASHCARDS;
      case "quiz":
        return PIPOLINK_OPERATION_COSTS.QUIZ;
      case "revision":
      case "revision_complete":
        return PIPOLINK_OPERATION_COSTS.REVISION_COMPLETE;
      case "exam":
      case "exam_prep":
        return PIPOLINK_OPERATION_COSTS.EXAM_PREP;
      case "notebook":
      case "notebook_analysis":
        return PIPOLINK_OPERATION_COSTS.NOTEBOOK_ANALYSIS;
      default:
        return PIPOLINK_OPERATION_COSTS.QUESTION_IA;
    }
  }
}
