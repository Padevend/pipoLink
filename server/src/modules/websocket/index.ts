import { WebSocketServer } from "ws";
import type { Server } from "http";
import { WebSocketGateway } from "./gateway/websocket-gateway.js";

export function initWebSocket(server: Server) {
  const wsServer = new WebSocketServer({ server, path: "/ws" });
  const gateway = new WebSocketGateway(wsServer);
  gateway.start();
  return gateway;
}

export { RealtimeBus } from "./gateway/realtime-bus.js";
export { WsEventName } from "./events/event-names.js";
