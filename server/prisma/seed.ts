import { PrismaClient } from "../generated/prisma/index.js";
import { hash } from "../config/hash.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Création d'un admin par défaut
  const passwordHash = await hash.make("Admin123!");
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@pipolink.app" },
    update: {},
    create: {
      email: "admin@pipolink.app",
      password: passwordHash,
      username: "admin",
      role: "admin",
      is_active: true,
      is_configured: true,
      profile: {
        create: {
          firstname: "Super",
          lastname: "Admin",
        }
      }
    },
  });

  console.log(`Admin user seeded: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
