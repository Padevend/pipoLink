# WebSocket Integration

ZiraSpace utilizes a robust WebSocket integration for real-time capabilities.

## Architecture
Located in `src/shared/websocket/manager.ts`, the `WebSocketManager` handles:
- Connection and automatic reconnection with exponential backoff.
- Authentication handshake using the user's secure token.
- Subscribing to and emitting specific server events.
- Centralized event listening via a local event emitter.

## Usage
Hooks and components can subscribe to realtime events using the `wsManager.on` method or the `useNetwork` hook wrappers.

```ts
import { wsManager } from '@/shared/websocket/manager';

// Subscribe to a new message event
const unsubscribe = wsManager.on('MESSAGE_NEW', (payload) => {
 
});

// Cleanup
unsubscribe();
```
