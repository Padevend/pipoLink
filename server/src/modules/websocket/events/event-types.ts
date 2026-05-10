export type WsEnvelope = {
  event: string;
  payload?: unknown;
  requestId?: string;
};

export type WsOutgoingEnvelope = {
  event: string;
  payload?: unknown;
  eventId: string;
  timestamp: string;
};

export type AuthInitPayload = {
  token: string;
  deviceId?: string | null;
  clientId?: string;
  lastEventId?: string | null;
};

export type AuthRefreshPayload = {
  token: string;
};

export type SyncResumePayload = {
  lastEventId?: string | null;
};

export type MessageSendPayload = {
  conversationId: string;
  content: string;
  iv: string;
  type?: "TEXT" | "IMAGE" | "DOCUMENT" | "SYSTEM";
};

export type MessageUpdatePayload = {
  messageId: string;
  content: string;
  iv: string;
};

export type MessageDeletePayload = {
  messageId: string;
};

export type MessageDeliveredPayload = {
  messageId: string;
};

export type MessageReadPayload = {
  conversationId: string;
  messageId?: string;
};

export type ConversationCreatePayload = {
  memberIds: string[];
};

export type TypingPayload = {
  conversationId: string;
};

export type PresencePayload = {
  status: "online" | "offline" | "away";
};
