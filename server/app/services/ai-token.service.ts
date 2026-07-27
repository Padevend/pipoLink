import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";
import { PIPOLINK_PLANS, PipoLinkPlanType } from "../config/pipolink-pricing.config.js";

export const TOKEN_PLANS = {
  FREE: {
    maxTokens: PIPOLINK_PLANS.FREE.maxTokens,
    windowDays: PIPOLINK_PLANS.FREE.windowDays,
    windowHours: PIPOLINK_PLANS.FREE.windowDays * 24,
    windowMs: PIPOLINK_PLANS.FREE.windowMs,
  },
  PREMIUM: {
    maxTokens: PIPOLINK_PLANS.PREMIUM.maxTokens,
    windowDays: PIPOLINK_PLANS.PREMIUM.windowDays,
    windowHours: PIPOLINK_PLANS.PREMIUM.windowDays * 24,
    windowMs: PIPOLINK_PLANS.PREMIUM.windowMs,
  },
} as const;

export class AiTokenService {
  /**
   * Retourne la configuration de jetons PipoLink selon le plan d'abonnement.
   */
  getTokenConfig(plan: string) {
    const isPremium = plan?.toUpperCase() === "PREMIUM";
    const planKey: PipoLinkPlanType = isPremium ? "PREMIUM" : "FREE";
    return TOKEN_PLANS[planKey];
  }

  /**
   * Récupère et restaure automatiquement le solde de Jetons PipoLink si l'échéance mensuelle (30 jours) est atteinte.
   */
  async getUserTokenStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw { code: ErrorCode.NOT_FOUND, status: 404, message: "Utilisateur introuvable." };
    }

    const isPremium = user.subscription?.plan === "PREMIUM" && user.subscription?.status === "ACTIVE";
    const plan = isPremium ? "PREMIUM" : "FREE";
    const config = this.getTokenConfig(plan);
    const now = new Date();

    let currentTokens = user.aiTokens;
    let lastRestoration = user.lastTokenRestorationAt;
    let nextRestoration = user.nextRestorationAt;
    let updated = false;

    // Ajuste le plafond de Jetons PipoLink si le plan a changé
    const targetMax = config.maxTokens;
    if (user.aiTokensMax !== targetMax) {
      currentTokens = Math.min(currentTokens, targetMax);
      updated = true;
    }

    // Vérifie si le renouvellement mensuel (30 jours) est échu
    if (nextRestoration && now >= nextRestoration) {
      currentTokens = targetMax;
      lastRestoration = now;
      nextRestoration = new Date(now.getTime() + config.windowMs);
      updated = true;
    } else if (!nextRestoration && currentTokens < targetMax) {
      nextRestoration = new Date(lastRestoration.getTime() + config.windowMs);
      if (now >= nextRestoration) {
        currentTokens = targetMax;
        lastRestoration = now;
        nextRestoration = new Date(now.getTime() + config.windowMs);
      }
      updated = true;
    }

    if (updated) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          aiTokens: currentTokens,
          aiTokensMax: targetMax,
          lastTokenRestorationAt: lastRestoration,
          nextRestorationAt: nextRestoration,
        },
      });
    }

    const timeRemainingMs = nextRestoration
      ? Math.max(0, nextRestoration.getTime() - now.getTime())
      : 0;

    return {
      tokens: currentTokens,
      maxTokens: targetMax,
      plan,
      windowDays: config.windowDays,
      windowHours: config.windowHours,
      lastTokenRestorationAt: lastRestoration,
      nextRestorationAt: nextRestoration,
      timeRemainingMs,
    };
  }

  /**
   * Vérifie si l'utilisateur possède suffisamment de Jetons PipoLink avant une opération.
   */
  async ensureSufficientTokens(userId: string, requiredCost: number) {
    const status = await this.getUserTokenStatus(userId);

    if (status.tokens < requiredCost) {
      const remainingDays = Math.ceil(status.timeRemainingMs / (24 * 60 * 60 * 1000));
      const timeStr = remainingDays > 1 ? `${remainingDays} jours` : `${Math.ceil(status.timeRemainingMs / (60 * 60 * 1000))} heures`;

      throw {
        code: ErrorCode.QUOTA_EXCEEDED,
        status: 402,
        message: `Solde de Jetons PipoLink insuffisant (${status.tokens}/${status.maxTokens}). Cette opération requiert ${requiredCost} jetons. Prochain renouvellement dans ${timeStr}. Passez au plan PREMIUM pour 2 000 Jetons PipoLink/mois.`,
        data: status,
      };
    }
    return status;
  }

  /**
   * Décrémente le solde de Jetons PipoLink du coût fixe de l'opération.
   */
  async consumeTokens(userId: string, amount: number) {
    const status = await this.getUserTokenStatus(userId);
    const config = this.getTokenConfig(status.plan);
    const now = new Date();

    const newTokens = Math.max(0, status.tokens - amount);
    let nextRestoration = status.nextRestorationAt;

    if (!nextRestoration || now >= nextRestoration) {
      nextRestoration = new Date(now.getTime() + config.windowMs);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        aiTokens: newTokens,
        nextRestorationAt: nextRestoration,
      },
    });

    return {
      tokens: newTokens,
      maxTokens: status.maxTokens,
      consumed: amount,
      plan: status.plan,
      nextRestorationAt: nextRestoration,
      timeRemainingMs: Math.max(0, nextRestoration.getTime() - now.getTime()),
    };
  }

  /**
   * Estimation indicative maintenue pour rétrocompatibilité.
   */
  estimateTokenCost(_promptText: string, _responseText = "", isStudyAid = false): number {
    return isStudyAid ? 25 : 5;
  }

  /**
   * Synchronise le solde et plafond de Jetons PipoLink lors des changements de plan.
   */
  async syncUserPlanTokens(userId: string, plan: string) {
    const isPremium = plan?.toUpperCase() === "PREMIUM";
    const config = isPremium ? TOKEN_PLANS.PREMIUM : TOKEN_PLANS.FREE;
    const now = new Date();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    if (isPremium) {
      // Upgrade Premium: octroie 2000 Jetons PipoLink avec renouvellement mensuel (30 jours)
      await prisma.user.update({
        where: { id: userId },
        data: {
          aiTokens: config.maxTokens,
          aiTokensMax: config.maxTokens,
          lastTokenRestorationAt: now,
          nextRestorationAt: new Date(now.getTime() + config.windowMs),
        },
      });
    } else {
      // Passation au plan Free: plafonne à 300 Jetons PipoLink max avec renouvellement mensuel
      const cappedTokens = Math.min(user.aiTokens, config.maxTokens);
      await prisma.user.update({
        where: { id: userId },
        data: {
          aiTokens: cappedTokens,
          aiTokensMax: config.maxTokens,
          lastTokenRestorationAt: now,
          nextRestorationAt: new Date(now.getTime() + config.windowMs),
        },
      });
    }
  }

  /**
   * Cron job mensuel de restauration des Jetons PipoLink expirés.
   */
  async processTokenRestorationCron() {
    const now = new Date();

    const usersToRestore = await prisma.user.findMany({
      where: {
        OR: [
          { nextRestorationAt: { lte: now } },
          { aiTokens: { lt: prisma.user.fields.aiTokensMax }, nextRestorationAt: null }
        ],
      },
      include: { subscription: true },
      take: 200,
    });

    let restoredCount = 0;

    for (const user of usersToRestore) {
      const isPremium = user.subscription?.plan === "PREMIUM" && user.subscription?.status === "ACTIVE";
      const config = isPremium ? TOKEN_PLANS.PREMIUM : TOKEN_PLANS.FREE;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          aiTokens: config.maxTokens,
          aiTokensMax: config.maxTokens,
          lastTokenRestorationAt: now,
          nextRestorationAt: new Date(now.getTime() + config.windowMs),
        },
      });
      restoredCount++;
    }

    return restoredCount;
  }
}
