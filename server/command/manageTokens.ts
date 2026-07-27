import { prisma } from "../config/database.js";
import { AiTokenService } from "../app/services/ai-token.service.js";

/**
 * Commande manuelle pour gérer les jetons IA d'un utilisateur :
 * - Réinitialiser instantanément le solde de jetons au maximum (Reset)
 * - Fixer manuellement le nombre précis de jetons d'un utilisateur (Set)
 * - Modifier facultativement le quota maximal (Max)
 *
 * Usage :
 *   pnpm tsx command/manageTokens.ts <email> --reset
 *   pnpm tsx command/manageTokens.ts <email> --set=<nombre> [--max=<nombre>]
 *   pnpm tsx command/manageTokens.ts <email> <nombre>
 *   pnpm tsx command/manageTokens.ts <email> --status
 */
class ManageTokensCommand {
  private aiTokenService = new AiTokenService();

  async run() {
    const args = process.argv.slice(2);

    let email: string | undefined;
    let isReset = false;
    let isStatus = false;
    let customTokens: number | undefined;
    let customMax: number | undefined;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith("--email=")) {
        email = arg.split("=")[1];
      } else if (arg === "--reset") {
        isReset = true;
      } else if (arg === "--status") {
        isStatus = true;
      } else if (arg.startsWith("--set=")) {
        const val = parseInt(arg.split("=")[1], 10);
        if (!isNaN(val)) customTokens = val;
      } else if (arg.startsWith("--max=")) {
        const val = parseInt(arg.split("=")[1], 10);
        if (!isNaN(val)) customMax = val;
      } else if (i === 0 && !arg.startsWith("--")) {
        email = arg;
      } else if (i === 1 && !arg.startsWith("--")) {
        const parsed = parseInt(arg, 10);
        if (!isNaN(parsed)) {
          customTokens = parsed;
        }
      }
    }

    if (!email) {
      console.error("\n❌ Erreur : L'adresse email de l'utilisateur est requise.");
      console.log("\nUsage :");
      console.log("  pnpm tsx command/manageTokens.ts <email> --reset");
      console.log("  pnpm tsx command/manageTokens.ts <email> --set=5000");
      console.log("  pnpm tsx command/manageTokens.ts <email> <nombre_jetons>");
      console.log("  pnpm tsx command/manageTokens.ts <email> --status");
      console.log("\nExemples :");
      console.log("  pnpm tsx command/manageTokens.ts user@example.com --reset");
      console.log("  pnpm tsx command/manageTokens.ts user@example.com 10000");
      console.log("  pnpm tsx command/manageTokens.ts user@example.com --set=5000 --max=10000\n");
      process.exit(1);
    }

    const cleanEmail = email.trim().toLowerCase();

    console.log(`\n🔍 Recherche de l'utilisateur "${cleanEmail}"...`);

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email "${cleanEmail}".\n`);
      process.exit(1);
    }

    console.log(`👤 Utilisateur trouvé : ${user.username || "Sans nom"} (ID: ${user.id})`);

    const isPremium = user.subscription?.plan === "PREMIUM" && user.subscription?.status === "ACTIVE";
    const plan = isPremium ? "PREMIUM" : "FREE";
    const config = this.aiTokenService.getTokenConfig(plan);
    const now = new Date();

    // Cas 1 : Affichage du statut sans modification
    if (isStatus && !isReset && customTokens === undefined && customMax === undefined) {
      const status = await this.aiTokenService.getUserTokenStatus(user.id);
      console.log("\n📊 Statut actuel des Jetons PipoLink :");
      console.log("========================================");
      console.log(` Email                  : ${user.email}`);
      console.log(` Plan                   : ${status.plan}`);
      console.log(` Jetons PipoLink actuels: ${status.tokens} / ${status.maxTokens}`);
      console.log(` Dernier renouvellement : ${status.lastTokenRestorationAt.toLocaleString("fr-FR")}`);
      console.log(` Prochain renouvellement: ${status.nextRestorationAt ? status.nextRestorationAt.toLocaleString("fr-FR") : "Immédiat"}`);
      console.log("========================================\n");
      process.exit(0);
    }

    // Cas 2 : Réinitialisation instantanée (--reset)
    if (isReset) {
      const targetMax = customMax ?? config.maxTokens;
      const nextRestoration = new Date(now.getTime() + config.windowMs);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          aiTokens: targetMax,
          aiTokensMax: targetMax,
          lastTokenRestorationAt: now,
          nextRestorationAt: nextRestoration,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          action: "MANUAL_TOKEN_RESET",
          targetId: user.id,
        },
      });

      console.log("\n⚡ Jetons PipoLink réinitialisés instantanément au maximum !");
      console.log("========================================");
      console.log(` Email                  : ${user.email}`);
      console.log(` Plan                   : ${plan}`);
      console.log(` Nouveau Solde          : ${targetMax} / ${targetMax}`);
      console.log(` Prochain renouvellement: ${nextRestoration.toLocaleString("fr-FR")}`);
      console.log("========================================\n");
      process.exit(0);
    }

    // Cas 3 : Définition manuelle du solde (--set ou argument numérique)
    if (customTokens !== undefined || customMax !== undefined) {
      const newTokens = customTokens ?? user.aiTokens;
      const newMax = customMax ?? Math.max(user.aiTokensMax, newTokens);
      const nextRestoration = new Date(now.getTime() + config.windowMs);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          aiTokens: newTokens,
          aiTokensMax: newMax,
          lastTokenRestorationAt: now,
          nextRestorationAt: nextRestoration,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          action: "MANUAL_TOKEN_UPDATE",
          targetId: user.id,
        },
      });

      console.log("\n✅ Solde de jetons IA mis à jour manuellement !");
      console.log("========================================");
      console.log(` Email                  : ${user.email}`);
      console.log(` Plan                   : ${plan}`);
      console.log(` Jetons ajustés         : ${newTokens} / ${newMax}`);
      console.log(` Prochain renouvellement: ${nextRestoration.toLocaleString("fr-FR")}`);
      console.log("========================================\n");
      process.exit(0);
    }

    // Si aucune action spécifiée, afficher l'aide
    const status = await this.aiTokenService.getUserTokenStatus(user.id);
    console.log("\n📊 Statut actuel des jetons IA :");
    console.log("========================================");
    console.log(` Email          : ${user.email}`);
    console.log(` Plan           : ${status.plan}`);
    console.log(` Jetons actuels : ${status.tokens} / ${status.maxTokens}`);
    console.log("========================================");
    console.log("\n⚠️  Aucune action spécifiée. Utilisez :");
    console.log(`  pnpm tsx command/manageTokens.ts ${user.email} --reset`);
    console.log(`  pnpm tsx command/manageTokens.ts ${user.email} 5000\n`);
    process.exit(0);
  }
}

new ManageTokensCommand().run().catch((err) => {
  console.error("\n❌ Erreur inattendue :", err);
  process.exit(1);
});
