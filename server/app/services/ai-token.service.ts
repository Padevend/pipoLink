import { prisma } from "../../config/database.js";
import { ErrorCode } from "../helpers/error-codes.js";

export const TOKEN_PLANS = {
  FREE: {
    maxTokens: 2500,
    windowHours: 6,
    windowMs: 6 * 60 * 60 * 1000, // 6 hours
  },
  PREMIUM: {
    maxTokens: 8000,
    windowHours: 3.5,
    windowMs: 3.5 * 60 * 60 * 1000, // 3 hours 30 minutes
  },
} as const;

export class AiTokenService {
  /**
   * Returns token configuration depending on subscription plan.
   */
  getTokenConfig(plan: string) {
    const isPremium = plan?.toUpperCase() === "PREMIUM";
    return isPremium ? TOKEN_PLANS.PREMIUM : TOKEN_PLANS.FREE;
  }

  /**
   * Retrieves and automatically restores tokens if restoration window expired.
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

    // Adjust max token limit if plan changed without updating max
    let targetMax = config.maxTokens;
    if (user.aiTokensMax !== targetMax) {
      currentTokens = Math.min(currentTokens, targetMax);
      updated = true;
    }

    // Check if token restoration is due
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
      windowHours: config.windowHours,
      lastTokenRestorationAt: lastRestoration,
      nextRestorationAt: nextRestoration,
      timeRemainingMs,
    };
  }

  /**
   * Check if user has sufficient tokens before starting an AI operation.
   */
  async ensureSufficientTokens(userId: string, requiredMinTokens = 20) {
    const status = await this.getUserTokenStatus(userId);
    if (status.tokens < requiredMinTokens) {
      const remainingMinutes = Math.ceil(status.timeRemainingMs / (60 * 1000));
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

      throw {
        code: ErrorCode.QUOTA_EXCEEDED,
        status: 402,
        message: `Solde de jetons d'IA insuffisant (${status.tokens}/${status.maxTokens}). Prochain renouvellement dans ${timeStr}. Passez au plan PREMIUM pour 8 000 jetons/3h30.`,
        data: status,
      };
    }
    return status;
  }

  /**
   * Deducts tokens after an AI interaction.
   */
  async consumeTokens(userId: string, amount: number) {
    const status = await this.getUserTokenStatus(userId);
    const config = this.getTokenConfig(status.plan);
    const now = new Date();

    const newTokens = Math.max(0, status.tokens - amount);
    let nextRestoration = status.nextRestorationAt;

    // If we consume tokens and nextRestoration is not set or passed, set it
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
   * Helper to estimate token cost of prompt + response.
   */
  estimateTokenCost(promptText: string, responseText = "", isStudyAid = false): number {
    const promptTokens = Math.ceil(promptText.length / 4);
    const responseTokens = Math.ceil(responseText.length / 4);
    const baseCost = isStudyAid ? 120 : 20;
    return Math.max(baseCost, promptTokens + responseTokens);
  }

  /**
   * Called when subscription plan changes (e.g. Free -> Premium or Premium -> Free)
   */
  async syncUserPlanTokens(userId: string, plan: string) {
    const isPremium = plan?.toUpperCase() === "PREMIUM";
    const config = isPremium ? TOKEN_PLANS.PREMIUM : TOKEN_PLANS.FREE;
    const now = new Date();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    if (isPremium) {
      // Upgrade to Premium: give 8000 tokens immediately and set 3.5h window
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
      // Downgrade to Free: cap tokens at 2500 max, 6h window
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
   * Scheduled cron job handler to restore token windows for all users whose timer expired.
   */
  async processTokenRestorationCron() {
    const now = new Date();

    // 1. Process users who reached or passed their nextRestorationAt
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
