export class RoomManager {
  private rooms = new Map<string, Set<string>>();

  join(room: string, connectionId: string) {
    if (!this.rooms.has(room)) this.rooms.set(room, new Set());
    this.rooms.get(room)!.add(connectionId);
  }

  leave(room: string, connectionId: string) {
    const set = this.rooms.get(room);
    if (!set) return;
    set.delete(connectionId);
    if (set.size === 0) this.rooms.delete(room);
  }

  leaveAll(connectionId: string) {
    for (const [room, set] of this.rooms.entries()) {
      if (set.has(connectionId)) {
        set.delete(connectionId);
        if (set.size === 0) this.rooms.delete(room);
      }
    }
  }

  getRoomMembers(room: string): Set<string> {
    return new Set(this.rooms.get(room) ?? []);
  }
}
