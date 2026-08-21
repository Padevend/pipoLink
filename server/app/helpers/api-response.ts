import { Context } from "hono";
import { HttpContext } from "../../config/app.js";

/**
 * Helper centralisé pour standardiser toutes les réponses de l'API.
 * Chaque controller doit utiliser ces méthodes — jamais c.json() directement.
 */
export class ApiResponse {

  /**
   * Réponse de succès standard.
   * @param c       - Contexte Hono
   * @param data    - Données à retourner
   * @param message - Message lisible
   * @param status  - Code HTTP (défaut 200)
   */
  static success(c: HttpContext , data: unknown, message: string, status = 200) {
    return c.json({
      success: true,
      message,
      data,
      meta: { timestamp: new Date().toISOString() },
    }, status as any);
  }

  /**
   * Réponse de succès paginée.
   * @param c        - Contexte Hono
   * @param data     - Tableau de résultats
   * @param total    - Nombre total d'éléments
   * @param page     - Page courante
   * @param limit    - Nombre d'éléments par page
   */
  static paginated(c: HttpContext, data: any, total: number, page: number, limit: number) {
    return c.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Réponse d'erreur métier.
   * @param c       - Contexte Hono
   * @param code    - Code d'erreur machine (ex: 'INVALID_OTP')
   * @param message - Message lisible par l'utilisateur
   * @param status  - Code HTTP
   * @param details - Données contextuelles optionnelles
   */
  static error(c: HttpContext, code: string, message: string, status: number, details?: Record<string,any>) {
    return c.json({
      success: false,
      error: code,
      message,
      details,
      meta: { timestamp: new Date().toISOString() },
    }, status as any);
  }
}
