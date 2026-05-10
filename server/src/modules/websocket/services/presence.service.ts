export type PresenceStatus = "online" | "offline" | "away";

export class PresenceService {
  private states = new Map<string, PresenceStatus>();

  setStatus(userId: string, status: PresenceStatus) {
    this.states.set(userId, status);
  }

  getStatus(userId: string): PresenceStatus {
    return this.states.get(userId) ?? "offline";
  }
}
