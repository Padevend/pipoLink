import * as SecureStore from 'expo-secure-store';
import { emitter } from './emitter';
import { WS_EVENTS, WsEvent } from '../constants/ws-events';

function wsBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_WS_URL;
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value || 'ws://10.0.2.2:3000/ws';
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

class WebSocketManager {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: any = null;

  getStatus(): ConnectionStatus {
    return this.status;
  }

  async connect() {
    if (this.socket || this.status === 'connecting') return;

    const token = await SecureStore.getItemAsync('auth_token');
    const deviceId = (await SecureStore.getItemAsync('device_id')) ?? 'mobile-app';
    if (!token) return;

    this.status = 'connecting';
    this.socket = new WebSocket(wsBaseUrl());

    this.socket.onopen = () => {
      this.status = 'connected';
      this.reconnectAttempts = 0;
      
      // Initial auth handshake
      this.send(WS_EVENTS.AUTH_INIT, {
        token,
        deviceId,
      });
      
      emitter.emit('status.change', 'connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const { event: eventName, payload } = JSON.parse(event.data);
        emitter.emit(eventName, payload);
      } catch (e) {
        console.error('WS Message parsing failed', e);
      }
    };

    this.socket.onclose = () => {
      this.status = 'disconnected';
      this.socket = null;
      emitter.emit('status.change', 'disconnected');
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      this.status = 'error';
      emitter.emit('status.change', 'error');
      console.error('WS Error', error);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    }
  }

  send(event: WsEvent | string, payload: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, payload }));
    } else {
      console.warn(`WS Not connected. Dropping event: ${event}`);
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
    this.status = 'disconnected';
  }

  on<T>(event: WsEvent | 'status.change' | string, handler: (payload: T) => void): () => void {
    return emitter.on(event, handler);
  }
}

export const wsManager = new WebSocketManager();

// Compatibility exports
export const connect = () => wsManager.connect();
export const disconnect = () => wsManager.disconnect();
export const send = (event: WsEvent | string, payload: any) => wsManager.send(event, payload);
export const on = <T>(event: WsEvent | 'status.change' | string, handler: (payload: T) => void) => wsManager.on(event, handler);
export const getStatus = () => wsManager.getStatus();
