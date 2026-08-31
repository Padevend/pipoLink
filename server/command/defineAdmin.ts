import { prisma } from "../config/database.js";

class ActivatePlanCommand {

  async run() {
    const args = process.argv.slice(2);

    let email: string | undefined;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("--email=")) {
        email = arg.split("=")[1];
      }
    }

    if (!email) {
      console.error("\n❌ Erreur : L'adresse email est requise.");
      console.log("\nUsage :");
      console.log("  pnpm tsx command/defineAdmin.ts <email>");
      console.log("  pnpm tsx command/defineAdmin.ts --email=user@domain.com");
      console.log("\nExemples :");
      console.log("  pnpm tsx command/defineAdmin.ts user@example.com");
      process.exit(1);
    }

    const cleanEmail = email.trim().toLowerCase();

    console.log(`\n🔍 Recherche de l'utilisateur avec l'email "${cleanEmail}"...`);

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      }
    });

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email "${cleanEmail}".\n`);
      process.exit(1);
    }

    console.log(`👤 Utilisateur trouvé : ${user.username || "Sans nom"} (ID: ${user.id})`);

    // On modifie le statut de l'utilisateur pour le mettre en admin
    let newUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        role: "admin",
      },
    });

    // Enregistrement d'un log d'audit
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: "DEFINE_ADMIN",
        targetId: user.id,
      },
    });

    console.log("\n✅ Role mis à jour avec succès !");
    console.log("========================================");
    console.log(` Email            : ${user.email}`);
    console.log(` Role             : ${newUser.role}`);
    console.log("========================================\n");

    process.exit(0);
  }
}

new ActivatePlanCommand().run().catch((err) => {
  console.error("\n❌ Erreur inattendue :", err);
  process.exit(1);
});
