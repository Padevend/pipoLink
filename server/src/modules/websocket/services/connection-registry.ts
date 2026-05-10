import type { WebSocket } from "ws";
import { RateLimiter } from "./rate-limit.service.js";

export type ConnectionState = {
  id: string;
  ws: WebSocket;
  ip: string;
  authenticated: boolean;
  userId?: string;
  deviceId?: string | null;
  role?: string;
  plan?: string;
  clientId?: string;
  lastSeenAt: Date;
  rateLimiter: RateLimiter;
  failedAuthAttempts: number;
};

export class ConnectionRegistry {
  private connections = new Map<string, ConnectionState>();
  private userConnections = new Map<string, Set<string>>();

  add(state: ConnectionState) {
    this.connections.set(state.id, state);
  }

  remove(connectionId: string) {
    const state = this.connections.get(connectionId);
    if (!state) return;
    this.connections.delete(connectionId);
    if (state.userId) {
      const set = this.userConnections.get(state.userId);
      if (set) {
        set.delete(connectionId);
        if (set.size === 0) this.userConnections.delete(state.userId);
      }
    }
  }

  get(connectionId: string): ConnectionState | undefined {
    return this.connections.get(connectionId);
  }

  setAuthenticated(connectionId: string, userId: string, deviceId: string | null, role: string, plan: string, clientId?: string) {
    const state = this.connections.get(connectionId);
    if (!state) return;
    state.authenticated = true;
    state.userId = userId;
    state.deviceId = deviceId;
    state.role = role;
    state.plan = plan;
    state.clientId = clientId;

    if (!this.userConnections.has(userId)) this.userConnections.set(userId, new Set());
    this.userConnections.get(userId)!.add(connectionId);
  }

  getUserConnections(userId: string): ConnectionState[] {
    const ids = this.userConnections.get(userId);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.connections.get(id)).filter(Boolean) as ConnectionState[];
  }

  hasUserConnections(userId: string): boolean {
    return this.getUserConnections(userId).length > 0;
  }

  getAllConnections(): ConnectionState[] {
    return Array.from(this.connections.values());
  }
}
