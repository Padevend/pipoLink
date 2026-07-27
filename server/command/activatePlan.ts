import { prisma } from "../config/database.js";
import { AiTokenService } from "../app/services/ai-token.service.js";
import { RealtimeBus } from "../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../src/modules/websocket/events/event-names.js";
import { DateTime } from "luxon";

class ActivatePlanCommand {
  private aiTokenService = new AiTokenService();

  async run() {
    const args = process.argv.slice(2);

    let email: string | undefined;
    let plan = "PREMIUM";
    let days = 30;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("--email=")) {
        email = arg.split("=")[1];
      } else if (arg.startsWith("--plan=")) {
        plan = arg.split("=")[1];
      } else if (arg.startsWith("--days=")) {
        days = parseInt(arg.split("=")[1], 10);
      } else if (i === 0 && !arg.startsWith("--")) {
        email = arg;
      } else if (i === 1 && !arg.startsWith("--")) {
        plan = arg;
      } else if (i === 2 && !arg.startsWith("--")) {
        const parsed = parseInt(arg, 10);
        if (!isNaN(parsed)) days = parsed;
      }
    }

    if (!email) {
      console.error("\n❌ Erreur : L'adresse email est requise.");
      console.log("\nUsage :");
      console.log("  pnpm tsx command/activatePlan.ts <email> [plan] [durationInDays]");
      console.log("  pnpm tsx command/activatePlan.ts --email=user@domain.com --plan=PREMIUM --days=30");
      console.log("\nExemples :");
      console.log("  pnpm tsx command/activatePlan.ts user@example.com");
      console.log("  pnpm tsx command/activatePlan.ts user@example.com PREMIUM 60");
      console.log("  pnpm tsx command/activatePlan.ts user@example.com FREE\n");
      process.exit(1);
    }

    const cleanEmail = email.trim().toLowerCase();
    plan = plan.trim().toUpperCase();

    if (!["PREMIUM", "FREE"].includes(plan)) {
      console.error(`\n❌ Plan invalide "${plan}". Les plans pris en charge sont PREMIUM ou FREE.\n`);
      process.exit(1);
    }

    console.log(`\n🔍 Recherche de l'utilisateur avec l'email "${cleanEmail}"...`);

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

    const currentPeriodEnd = plan === "PREMIUM" 
      ? DateTime.now().plus({ days }).toJSDate() 
      : null;

    let subscription;
    if (user.subscription) {
      subscription = await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          plan,
          status: "ACTIVE",
          currentPeriodEnd,
        },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          user_id: user.id,
          plan,
          status: "ACTIVE",
          currentPeriodEnd,
        },
      });
    }

    // Restaure et synchronise le quota de Jetons PipoLink selon le plan (ex: 2000 Jetons pour PREMIUM, 300 pour FREE)
    await this.aiTokenService.syncUserPlanTokens(user.id, plan);

    // Enregistrement d'un log d'audit
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: "MANUAL_SUBSCRIPTION_ACTIVATION",
        targetId: subscription.id,
      },
    });

    // Publication de l'événement en temps réel (si WebSocket actif)
    try {
      RealtimeBus.emit(WsEventName.SubscriptionUpdated, subscription, { userId: user.id });
    } catch {
      // Ignoré en exécution CLI hors processus WebSocket principal
    }

    const tokenStatus = await this.aiTokenService.getUserTokenStatus(user.id);

    console.log("\n✅ Plan d'abonnement mis à jour avec succès !");
    console.log("========================================");
    console.log(` Email            : ${user.email}`);
    console.log(` Plan             : ${subscription.plan}`);
    console.log(` Statut           : ${subscription.status}`);
    console.log(` Expiration       : ${subscription.currentPeriodEnd ? subscription.currentPeriodEnd.toLocaleString("fr-FR") : "Illimité / Sans expiration"}`);
    console.log(` Jetons PipoLink  : ${tokenStatus.tokens} / ${tokenStatus.maxTokens} (Renouvellement: ${tokenStatus.windowDays} jours)`);
    console.log("========================================\n");

    process.exit(0);
  }
}

new ActivatePlanCommand().run().catch((err) => {
  console.error("\n❌ Erreur inattendue :", err);
  process.exit(1);
});
