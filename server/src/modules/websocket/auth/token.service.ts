import { ErrorCode } from "../../../../app/helpers/error-codes.js";
import { prisma } from "../../../../config/database.js";
import { hash } from "../../../../config/hash.js";


export type AuthResult = {
  userId: string;
  deviceId: string | null;
  role: string;
  plan: string;
};

export class TokenService {
  async authenticate(token: string, deviceId?: string): Promise<AuthResult> {
    const decoded = await hash.jwt.decode(token);
    const payload = decoded.payload as { sub: string; role?: string; deviceId?: string | null };

    if (!payload?.sub) {
      throw { code: ErrorCode.UNAUTHORIZED, status: 401, message: "Token invalide ou expiré." };
    }

    if (payload.deviceId && deviceId && payload.deviceId !== deviceId) {
      throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Appareil non autorisé pour ce token." };
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.is_active || user.is_excluded) {
      throw { code: ErrorCode.UNAUTHORIZED, status: 401, message: "Compte inactif ou non vérifié." };
    }

    let resolvedDeviceId: string | null = payload.deviceId ?? deviceId ?? null;
    if (resolvedDeviceId) {
      const device = await prisma.device.findFirst({ where: { id: resolvedDeviceId, user_id: user.id, revokedAt: null } });
      if (!device) {
        throw { code: ErrorCode.FORBIDDEN, status: 403, message: "Appareil révoqué ou introuvable." };
      }
      await prisma.device.update({ where: { id: device.id }, data: { lastActiveAt: new Date() } });
      resolvedDeviceId = device.id;
    }

    const subscription = await prisma.subscription.findUnique({ where: { user_id: user.id } });
    const plan = subscription && subscription.plan === "PREMIUM" && subscription.status === "ACTIVE" ? "PREMIUM" : "FREE";

    return {
      userId: user.id,
      deviceId: resolvedDeviceId,
      role: user.role,
      plan,
    };
  }
}
