import { WsEventName } from "../events/event-names.js";
import { validatePayload } from "../utils/validation.js";
import { authInitValidator, authRefreshValidator, syncResumeValidator } from "../dto/auth.dto.js";
import type { HandlerContext } from "./index.js";

export async function handleAuthInit(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const data = await validatePayload(authInitValidator, payload);
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  try {
    const auth = await ctx.gateway.authenticate(ctx.connectionId, data.token, data.deviceId, data.clientId);
    if (data.lastEventId) await ctx.gateway.resume(ctx.connectionId, data.lastEventId);
    ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.AuthInit, {
      userId: auth.userId,
      deviceId: auth.deviceId,
      role: auth.role,
      plan: auth.plan,
    });
  } catch (err: any) {
    if (state) state.failedAuthAttempts += 1;
    if (state && state.failedAuthAttempts >= 5) state.ws.close();
    throw err;
  }
}

export async function handleAuthRefresh(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const data = await validatePayload(authRefreshValidator, payload);
  const auth = await ctx.gateway.authenticate(ctx.connectionId, data.token);
  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.AuthRefresh, {
    userId: auth.userId,
    deviceId: auth.deviceId,
    role: auth.role,
    plan: auth.plan,
  });
}

export async function handleSyncResume(ctx: HandlerContext, payload: unknown, requestId?: string) {
  const data = await validatePayload(syncResumeValidator, payload);
  const events = await ctx.gateway.resume(ctx.connectionId, data.lastEventId ?? null);
  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.SyncResume, { count: events.length });
}

export async function handleSystemPing(ctx: HandlerContext, _payload: unknown, requestId?: string) {
  const state = ctx.gateway.getConnectionState(ctx.connectionId);
  if (!state) return;
  ctx.gateway.sendAck(ctx.connectionId, requestId, WsEventName.SystemPing, { ts: Date.now() });
  ctx.gateway.sendSystem(state.ws, WsEventName.SystemPong, { ts: Date.now() });
}
