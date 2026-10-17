
import { env } from "./envManager.js";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import { PrismaClient } from '../generated/prisma/client.js';

function getDatabaseCa(): string | undefined {
  const raw = (
    env.get("DATABASE_CA_CERT_BASE64") ??
    env.get("DATABASE_CA_PATH")
  )?.trim();
  if (!raw) return undefined;

  if (raw.includes("-----BEGIN")) return raw.replace(/\\n/g, "\n");

  const decoded = Buffer.from(raw, "base64").toString("utf8");
  if (decoded.includes("-----BEGIN")) return decoded;

  return fs.readFileSync(raw, "utf8");
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
