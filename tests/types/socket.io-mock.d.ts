declare module 'socket.io-mock' {
  type Listener = (...args: any[]) => void;

  export default class SocketMock {
    id: string;
    data: Record<string, unknown>;
    handshake: {
      auth?: {
        token?: string;
      };
    };
    joinedRooms: string[];
    rooms: string[];
    user?: unknown;
    broadcast: {
      to(room: string): {
        emit(event: string, payload?: unknown): void;
      };
    };
    socketClient: {
      emit(event: string, ...args: unknown[]): void;
    };
    on(event: string, listener: Listener): this;
    once(event: string, listener: Listener): this;
    off(event: string, listener: Listener): this;
    emit(event: string, ...args: unknown[]): this;
    emitEvent(event: string, args: unknown[], ack?: Listener): void;
    onEmit(event: string, listener: Listener): void;
    join(room: string): void;
    leave(room: string): void;
    disconnect(): this;
  }
}
