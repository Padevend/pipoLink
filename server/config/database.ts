
import { env } from "./envManager.js";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import { PrismaClient } from '../generated/prisma/client.js';

function getDatabaseCa(): string | undefined {
  const encoded = env.get("DATABASE_CA_CERT_BASE64");
  if (encoded) return Buffer.from(encoded, "base64").toString("utf8");

  const path = env.get("DATABASE_CA_PATH");
  return path ? fs.readFileSync(path).toString() : undefined;
}

const databaseCa = getDatabaseCa();
if (env.get("NODE_ENV") === "production" && !databaseCa) {
  throw new Error("DATABASE_CA_CERT_BASE64 ou DATABASE_CA_PATH est requis en production pour PostgreSQL TLS.");
}

const adapter = new PrismaPg({
    connectionString: env.get("DATABASE_URL"),
    ...(
        env.get("NODE_ENV") === "production" && {
            ssl: {
                ca: databaseCa,
                rejectUnauthorized: true,
            },
        }
    ),
})

export const prisma = new PrismaClient({ adapter });
