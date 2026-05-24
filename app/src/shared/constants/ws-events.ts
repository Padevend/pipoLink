export const WS_EVENTS = {
  // System
  AUTH_INIT: 'auth.init',
  AUTH_REFRESH: 'auth.refresh',
  SYSTEM_READY: 'system.ready',
  SYSTEM_ACK: 'system.ack',
  SYSTEM_ERROR: 'system.error',
  PING: 'system.ping',
  PONG: 'system.pong',
  SYNC_RESUME: 'sync.resume',

  // Messaging (Server -> Client)
  MESSAGE_CREATED: 'message.created',
  MESSAGE_UPDATED: 'message.updated',
  MESSAGE_DELETED: 'message.deleted',
  MESSAGE_DELIVERED: 'message.delivered',
  MESSAGE_READ: 'message.read',
  CONVERSATION_CREATED: 'conversation.created',
  CONVERSATION_UPDATED: 'conversation.updated',
  
  // Messaging (Client -> Server)
  MESSAGE_SEND: 'message.send',
  MESSAGE_UPDATE: 'message.update',
  MESSAGE_DELETE: 'message.delete',
  MESSAGE_READ_CLIENT: 'message.read',
  TYPING_STARTED: 'typing.started',
  TYPING_STOPPED: 'typing.stopped',
  PRESENCE_UPDATED: 'presence.updated',

  // Others
  NOTIFICATION_CREATED: 'notification.created',
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_UPDATED: 'document.updated',
  DEVICE_LINKED: 'device.linked',
  DEVICE_REVOKED: 'device.revoked',
  AI_RESPONSE_CREATED: 'ai.response.created',
  ANNOUNCEMENT_CREATED: 'announcement.created',
  ANNOUNCEMENT_DELETE: 'announcement.delete',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
} as const;

export type WsEvent = typeof WS_EVENTS[keyof typeof WS_EVENTS];
