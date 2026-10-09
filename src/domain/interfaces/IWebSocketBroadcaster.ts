export interface IWebSocketBroadcaster {
  broadcastToRoom(room: string, event: string, data: Record<string, unknown>): void;
}
