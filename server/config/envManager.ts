import { config } from "dotenv"
import vine from "@vinejs/vine"
import EnvSchema from "../start/env.js"

config()

/**
 * Fonction de validation
 */
async function validateEnv() {
  const result: Record<string, any> = {}

  for (const key in EnvSchema) {
    const value = process.env[key]

    if (value === undefined) {
      result[key] = undefined
      continue
    }

    try {
      const validator = vine.compile(EnvSchema[key as keyof typeof EnvSchema])
      result[key] = await validator.validate(value)
    } catch {
      console.warn(`Variable "${key}" invalide → ignorée`)
      result[key] = undefined
    }
  }

  return result
}

const envData = await validateEnv()

type EnvType = {
  [K in keyof typeof EnvSchema]: Awaited<ReturnType<typeof validateEnv>>[K]
}

class EnvManager {
  constructor(private readonly env: EnvType) {}

  get<K extends keyof EnvType>(key: K): EnvType[K] {
    return this.env[key]
  }

  has<K extends keyof EnvType>(key: K): boolean {
    return this.env[key] !== undefined
  }

  all(): EnvType {
    return this.env
  }
}

export const env = new EnvManager(envData as EnvType)