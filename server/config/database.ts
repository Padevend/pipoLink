import { PrismaClient } from "../generated/prisma/index.js";
import { env } from "./envManager.js";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";

const adapter = new PrismaPg({
    connectionString: env.get("DATABASE_URL"),
    ssl: {
        ca: fs.readFileSync(env.get("DATABASE_CA_PATH")).toString(),
        rejectUnauthorized: true,
    }
})

export const prisma = new PrismaClient({ adapter });