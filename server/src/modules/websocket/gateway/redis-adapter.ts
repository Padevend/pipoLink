import { Redis } from 'ioredis';
import type { WebSocketGateway, GatewayEmitTarget } from './websocket-gateway.js';

type RedisMessage = {
  type: 'emit' | 'join_room';
  event?: string;
  payload?: unknown;
  target?: GatewayEmitTarget;
  userId?: string;
  conversationId?: string;
  senderInstanceId: string;
};

export class RedisAdapter {
  private pub: Redis;
  private sub: Redis;
  private instanceId: string;
  private gateway!: WebSocketGateway;

  constructor(redisUrl: string) {
    this.pub = new Redis(redisUrl);
    this.sub = new Redis(redisUrl);
    this.instanceId = Math.random().toString(36).substring(2, 15);

    this.sub.subscribe('pipolink:ws:events');
    this.sub.on('message', (channel, message) => {
      if (channel === 'pipolink:ws:events') {
        try {
          const parsed = JSON.parse(message) as RedisMessage;
          if (parsed.senderInstanceId !== this.instanceId && this.gateway) {
            if (parsed.type === 'emit' && parsed.event && parsed.target) {
              this.gateway.localEmit(parsed.event, parsed.payload, parsed.target);
            } else if (parsed.type === 'join_room' && parsed.userId && parsed.conversationId) {
              this.gateway.localAddUserToConversationRoom(parsed.userId, parsed.conversationId);
            }
          }
        } catch (e) {
          console.error('Redis message parse error', e);
        }
      }
    });
  }

  setGateway(gateway: WebSocketGateway) {
    this.gateway = gateway;
  }

  publish(event: string, payload: unknown, target: GatewayEmitTarget) {
    if (this.gateway) {
        this.gateway.localEmit(event, payload, target);
    }
    
    this.pub.publish('pipolink:ws:events', JSON.stringify({
      type: 'emit',
      event,
      payload,
      target,
      senderInstanceId: this.instanceId
    }));
  }

  publishJoinRoom(userId: string, conversationId: string) {
    if (this.gateway) {
      this.gateway.localAddUserToConversationRoom(userId, conversationId);
    }

    this.pub.publish('pipolink:ws:events', JSON.stringify({
      type: 'join_room',
      userId,
      conversationId,
      senderInstanceId: this.instanceId
    }));
  }
}
