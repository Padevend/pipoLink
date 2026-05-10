import { PrismaClient } from "../generated/prisma/index.js";
import { env } from "./envManager.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: env.get("DATABASE_URL")
})

export const prisma = new PrismaClient({ adapter });