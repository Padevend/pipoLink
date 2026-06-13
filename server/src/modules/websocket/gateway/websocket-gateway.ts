import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import { prisma } from "../../../../config/database.js";
import { WsEventName } from "../events/event-names.js";
import { WsEnvelope, WsOutgoingEnvelope } from "../events/event-types.js";
import { safeJsonParse } from "../utils/safe-json.js";
import { createId } from "../utils/ids.js";
import { nowIso } from "../utils/time.js";
import { ConnectionRegistry } from "../services/connection-registry.js";
import type { ConnectionState } from "../services/connection-registry.js";
import { RateLimiter } from "../services/rate-limit.service.js";
import { RoomManager } from "../rooms/room-manager.js";
import { OfflineQueueService } from "../services/offline-queue.service.js";
import { TokenService } from "../auth/token.service.js";
import { RealtimeBus } from "./realtime-bus.js";
import { createHandlers } from "../handlers/index.js";
import { RedisAdapter } from "./redis-adapter.js";

export type GatewayContext = {
  connectionId: string;
  ws: WebSocket;
};

export type GatewayEmitTarget = {
  userId?: string;
  conversationId?: string;
  deviceId?: string;
  excludeConnectionId?: string;
};

export class WebSocketGateway {
  private registry = new ConnectionRegistry();
  private rooms = new RoomManager();
  private offlineQueue = new OfflineQueueService();
  private tokenService = new TokenService();
  private handlers = createHandlers();
  private heartbeatInterval?: NodeJS.Timeout;
  private redisAdapter?: RedisAdapter;

  constructor(private server: WebSocketServer) {
    if (process.env.REDIS_URL) {
      this.redisAdapter = new RedisAdapter(process.env.REDIS_URL);
      this.redisAdapter.setGateway(this);
    }

    RealtimeBus.setEmitter({
      emit: (event, payload, target) => this.emit(event, payload, target),
      addUserToConversationRoom: (userId, conversationId) => this.addUserToConversationRoom(userId, conversationId),
    });
  }

  /**
   * Bootstraps the WebSocket server and binds all transport handlers.
   */
  start() {
    this.server.on("connection", (ws: any, req: any) => {
      const connectionId = createId("conn");
      const ip = req.socket.remoteAddress ?? "unknown";
      const state: ConnectionState = {
        id: connectionId,
        ws,
        ip,
        authenticated: false,
        lastSeenAt: new Date(),
        rateLimiter: new RateLimiter(40, 20),
        failedAuthAttempts: 0,
      };

      this.registry.add(state);
      this.sendSystem(ws, WsEventName.SystemReady, { connectionId });

      ws.on("message", async (raw: any) => {
        if (!state.rateLimiter.allow()) {
          return this.sendSystem(ws, WsEventName.SystemError, {
            code: "RATE_LIMITED",
            message: "Trop de requetes websocket.",
          });
        }

        const payloadRaw = typeof raw === "string" ? raw : raw.toString();
        const parsed = safeJsonParse(payloadRaw);
        if (!parsed.ok) {
          return this.sendSystem(ws, WsEventName.SystemError, {
            code: "INVALID_PAYLOAD",
            message: parsed.error,
          });
        }

        const envelope = parsed.value as WsEnvelope;
        if (!envelope?.event) {
          return this.sendSystem(ws, WsEventName.SystemError, {
            code: "INVALID_PAYLOAD",
            message: "Event manquant.",
          });
        }

        const unauthAllowed = new Set<string>([WsEventName.AuthInit, WsEventName.AuthRefresh, WsEventName.SystemPing]);
        if (!state.authenticated && !unauthAllowed.has(envelope.event)) {
          return this.sendSystem(ws, WsEventName.SystemError, {
            code: "UNAUTHORIZED",
            message: "Authentification requise.",
            requestId: envelope.requestId,
          });
        }

        const handler = this.handlers[envelope.event];
        if (!handler) {
          return this.sendSystem(ws, WsEventName.SystemError, {
            code: "UNKNOWN_EVENT",
            message: `Event non supporte: ${envelope.event}`,
            requestId: envelope.requestId,
          });
        }

        try {
          await handler({ gateway: this, connectionId }, envelope.payload, envelope.requestId);
        } catch (err: any) {
          this.sendSystem(ws, WsEventName.SystemError, {
            code: err?.code ?? "INTERNAL_ERROR",
            message: err?.message ?? "Erreur serveur.",
            details: err?.details,
            requestId: envelope.requestId,
          });
        }
      });

      ws.on("close", () => {
        this.rooms.leaveAll(connectionId);
        this.registry.remove(connectionId);
        this.updatePresenceOnDisconnect(state.userId);
      });

      ws.on("error", () => {
        this.rooms.leaveAll(connectionId);
        this.registry.remove(connectionId);
        this.updatePresenceOnDisconnect(state.userId);
      });
    });

    this.startHeartbeat();
  }

  /**
   * Authenticates a socket with a JWT token and joins all rooms.
   */
  async authenticate(connectionId: string, token: string, deviceId?: string, clientId?: string) {
    const auth = await this.tokenService.authenticate(token, deviceId);
    this.registry.setAuthenticated(connectionId, auth.userId, auth.deviceId ?? null, auth.role, auth.plan, clientId);
    this.joinUserRooms(connectionId, auth.userId, auth.deviceId ?? undefined);
    await this.joinConversationRooms(connectionId, auth.userId);
    await this.broadcastPresence(auth.userId);
    return auth;
  }

  /**
   * Replays queued events for a user after reconnect.
   */
  async resume(connectionId: string, lastEventId?: string | null) {
    const state = this.registry.get(connectionId);
    if (!state?.userId) return [];
    const queued = this.offlineQueue.drain(state.userId, lastEventId);
    for (const event of queued) {
      this.send(state.ws, event);
    }
    this.offlineQueue.clear(state.userId);
    return queued;
  }

  /**
   * Emits a realtime event to a target via Redis Pub/Sub.
   */
  emit(event: string, payload: unknown, target: GatewayEmitTarget) {
    if (this.redisAdapter) {
      this.redisAdapter.publish(event, payload, target);
    } else {
      this.localEmit(event, payload, target);
    }
  }

  /**
   * Emits a realtime event locally to the connected clients on this instance.
   */
  localEmit(event: string, payload: unknown, target: GatewayEmitTarget) {
    const envelope = this.buildEvent(event, payload);
    if (target.userId) {
      const connections = this.registry.getUserConnections(target.userId);
      if (connections.length === 0) {
        this.offlineQueue.enqueue(target.userId, envelope);
      }
      for (const conn of connections) {
        if (target.excludeConnectionId && conn.id === target.excludeConnectionId) continue;
        this.send(conn.ws, envelope);
      }
      return;
    }

    if (target.deviceId) {
      const connections = this.registry.getAllConnections().filter((conn) => conn.deviceId === target.deviceId);
      for (const conn of connections) {
        if (target.excludeConnectionId && conn.id === target.excludeConnectionId) continue;
        this.send(conn.ws, envelope);
      }
      return;
    }

    if (target.conversationId) {
      const room = this.roomName("conversation", target.conversationId);
      const members = this.rooms.getRoomMembers(room);
      for (const connectionId of members) {
        if (target.excludeConnectionId && connectionId === target.excludeConnectionId) continue;
        const state = this.registry.get(connectionId);
        if (state) this.send(state.ws, envelope);
      }
      return;
    }

    for (const state of this.registry.getAllConnections()) {
      if (target.excludeConnectionId && state.id === target.excludeConnectionId) continue;
      this.send(state.ws, envelope);
    }
  }

  sendAck(connectionId: string, requestId: string | undefined, event: string, data?: unknown) {
    if (!requestId) return;
    const state = this.registry.get(connectionId);
    if (!state) return;
    this.send(state.ws, this.buildEvent(WsEventName.SystemAck, { requestId, event, data }));
  }

  sendSystem(ws: WebSocket, event: string, payload: any) {
    this.send(ws, this.buildEvent(event, payload));
  }

  getConnectionState(connectionId: string) {
    return this.registry.get(connectionId);
  }

  addUserToConversationRoom(userId: string, conversationId: string) {
    if (this.redisAdapter) {
      this.redisAdapter.publishJoinRoom(userId, conversationId);
    } else {
      this.localAddUserToConversationRoom(userId, conversationId);
    }
  }

  localAddUserToConversationRoom(userId: string, conversationId: string) {
    const room = this.roomName("conversation", conversationId);
    for (const conn of this.registry.getUserConnections(userId)) {
      this.rooms.join(room, conn.id);
    }
  }

  private buildEvent(event: string, payload?: unknown): WsOutgoingEnvelope {
    return {
      event,
      payload,
      eventId: createId("evt"),
      timestamp: nowIso(),
    };
  }

  private send(ws: WebSocket, payload: WsOutgoingEnvelope) {
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify(payload));
  }

  private joinUserRooms(connectionId: string, userId: string, deviceId?: string) {
    this.rooms.join(this.roomName("user", userId), connectionId);
    if (deviceId) this.rooms.join(this.roomName("device", deviceId), connectionId);
  }

  private async joinConversationRooms(connectionId: string, userId: string) {
    const memberships = await prisma.conversationMember.findMany({
      where: { user_id: userId },
      select: { conversation_id: true },
    });
    for (const membership of memberships) {
      this.rooms.join(this.roomName("conversation", membership.conversation_id), connectionId);
    }
  }

  private roomName(type: "user" | "device" | "conversation", id: string) {
    return `${type}:${id}`;
  }

  private async broadcastPresence(userId?: string) {
    if (!userId) return;
    const online = this.registry.hasUserConnections(userId);
    const status = online ? "online" : "offline";

    const memberships = await prisma.conversationMember.findMany({
      where: { user_id: userId },
      select: { conversation_id: true },
    });

    for (const membership of memberships) {
      this.emit(WsEventName.PresenceUpdated, { userId, status }, { conversationId: membership.conversation_id });
    }
  }

  private updatePresenceOnDisconnect(userId?: string) {
    if (!userId) return;
    if (!this.registry.hasUserConnections(userId)) {
      this.broadcastPresence(userId).catch(() => {});
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      for (const state of this.registry.getAllConnections()) {
        if (state.ws.readyState !== state.ws.OPEN) continue;
        try {
          state.ws.ping();
        } catch {
          state.ws.terminate();
        }
      }
    }, 30000);
  }
}
