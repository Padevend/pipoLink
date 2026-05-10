import bcrypt from "bcrypt";
import * as crypto from "crypto";
import { env } from "./envManager.js";

import { Jwt } from "hono/utils/jwt";
import { DateTime } from "luxon";

class HashHelpers {
  private async _jwtDecode(jwtToken: string): Promise<Record<string, any>> {
    let payload = await Jwt.verify(jwtToken, env.get("JWT_SECRET"), "HS256");

    return payload as Partial<{ exp: number; iat: number; iss: string }>;
  }

  private async _jwtEncode(payload: Record<string, any>): Promise<string> {
    let token = await Jwt.sign(
      {
        payload,
        exp: DateTime.utc().plus({ days: 30 }).toSeconds(),
        //iat: DateTime.utc().toSeconds(),
        iss: env.get("CLIENT_DOMAIN"),
      },
      env.get("JWT_SECRET"),
      "HS256",
    );

    return token;
  }

  public async make(value: string): Promise<string> {
    return await bcrypt.hash(value, 10);
  }

  public async compare(value: string, hash: string): Promise<boolean> {
    return await bcrypt.compareSync(value, hash);
  }

  public async sha512(value: string): Promise<string> {
    return crypto.createHash("sha512").update(value).digest("hex");
  }

  public generateRandomString(
    length: number = 32,
    type: "numeric" | "alphanumeric" = "alphanumeric",
  ) {
    const chars =
      type === "numeric"
        ? "0123456789"
        : "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join("");
  }

  get jwt() {
    return {
      decode: async (jwtToken: string): Promise<Record<string, any>> =>
        await this._jwtDecode(jwtToken),
      encode: async (payload: Record<string, any>): Promise<string> =>
        await this._jwtEncode(payload),
    };
  }
}

export const hash = new HashHelpers();
