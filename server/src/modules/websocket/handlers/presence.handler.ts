import { prisma } from "../../../../config/database.js";
import { WsEventName } from "../events/event-names.js";
import { validatePayload } from "../utils/validation.js";
import { presenceValidator } from "../dto/presence.dto.js";
import type { HandlerContext } from "./index.js";
import { PresenceService } from "../services/presence.service.js";

const presence = new PresenceService();

export async function handlePresenceUpdate(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  if (!state?.userId) throw { code: "UNAUTHORIZED", status: 401, message: "Authentification requise." };

  const data = await validatePayload(presenceValidator, payload);
  presence.setStatus(state.userId, data.status);

  const memberships = await prisma.conversationMember.findMany({
    where: { user_id: state.userId },
    select: { conversation_id: true },
  });

  for (const membership of memberships) {
    ctx.gateway.emit(WsEventName.PresenceUpdated, { userId: state.userId, status: data.status }, {
      conversationId: membership.conversation_id,
    });
  }

  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.PresenceUpdated, { status: data.status });
}
