import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import SocketMock from 'socket.io-mock';
import { TelemetryGateway } from '../src/http/gateways/TelemetryGateway';
import { SocketBroadcaster } from '../src/infrastructure/websockets/SocketBroadcaster';

const JWT_SECRET = 'test-secret';
const ORDER_ID = '00000000-0000-4000-8000-000000000001';

type Next = (error?: Error) => void;
type Middleware = (socket: Socket, next: Next) => void;

interface TestSocket {
  id: string;
  handshake: { auth?: { token?: string } };
  joinedRooms: string[];
  user?: { id: string; role?: string };
  socketClient: { emit(event: string, ...args: any[]): void };
  on(event: string, listener: (...args: any[]) => void): void;
  onEmit(event: string, listener: (...args: any[]) => void): void;
  to(room: string): { emit(event: string, payload: unknown): void };
}

class MockIo {
  middleware?: Middleware;
  connectionHandler?: (socket: Socket) => void;

  use = jest.fn((middleware: Middleware) => {
    this.middleware = middleware;
  });

  on = jest.fn((event: string, handler: (socket: Socket) => void) => {
    if (event === 'connection') {
      this.connectionHandler = handler;
    }
  });
}

const createGateway = (): MockIo => {
  const io = new MockIo();
  new TelemetryGateway(io as unknown as Server);
  return io;
};

const createSocket = (user?: { id: string; role?: string }): TestSocket => {
  const mocked = new SocketMock() as unknown as TestSocket & {
    broadcast: { to(room: string): { emit(event: string, payload: unknown): void } };
  };

  mocked.handshake = { auth: { token: 'valid-token' } };
  mocked.user = user;
  mocked.to = (room: string) => mocked.broadcast.to(room);

  return mocked;
};

const connect = (io: MockIo, socket: TestSocket): void => {
  io.connectionHandler?.(socket as unknown as Socket);
};

const validTelemetry = {
  orderId: ORDER_ID,
  coords: {
    lat: 19.4326,
    lng: -99.1332,
    accuracy: 5,
    speed: 10,
  },
};

describe('TelemetryGateway', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('autenticación', () => {
    it('rechaza conexiones que carecen de token', () => {
      const io = createGateway();
      const next = jest.fn();
      const socket = {
        id: 'socket-1',
        handshake: { auth: {} },
      } as unknown as Socket;

      io.middleware?.(socket, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0] as Error;
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Autenticación requerida');
    });

    it('rechaza conexiones con token inválido', () => {
      const io = createGateway();
      const next = jest.fn();
      const token = jwt.sign({ id: 'driver-1' }, 'wrong-secret');
      const socket = {
        id: 'socket-1',
        handshake: { auth: { token } },
      } as unknown as Socket;

      io.middleware?.(socket, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0] as Error;
      expect(error.message).toBe('Token WS inválido o expirado');
    });

    it('acepta conexiones con token válido y adjunta el usuario al socket', () => {
      const io = createGateway();
      const next = jest.fn();
      const token = jwt.sign({ id: 'driver-1', role: 'DELIVERY_DRIVER' }, JWT_SECRET);
      const socket = {
        id: 'socket-1',
        handshake: { auth: { token } },
      } as any;

      io.middleware?.(socket, next);

      expect(next).toHaveBeenCalledWith();
      expect(socket.user).toMatchObject({ id: 'driver-1', role: 'DELIVERY_DRIVER' });
    });
  });

  describe('suscripciones', () => {
    it('registra el socket en la sala del pedido al emitir order:subscribe', () => {
      const io = createGateway();
      const socket = createSocket({ id: 'customer-1', role: 'CUSTOMER' });

      connect(io, socket);
      socket.socketClient.emit('order:subscribe', ORDER_ID);

      expect(socket.joinedRooms).toContain(`order_room_${ORDER_ID}`);
    });

    it('registra el socket en driver_room_{driverId} usando el id del JWT', () => {
      const io = createGateway();
      const socket = createSocket({ id: 'driver-1', role: 'DELIVERY_DRIVER' });

      connect(io, socket);
      socket.socketClient.emit('driver:subscribe');

      expect(socket.joinedRooms).toContain('driver_room_driver-1');
    });

    it('rechaza que un repartidor se suscriba a la sala de otro repartidor', () => {
      const io = createGateway();
      const socket = createSocket({ id: 'driver-1', role: 'DELIVERY_DRIVER' });

      connect(io, socket);
      socket.socketClient.emit('driver:subscribe', { driverId: 'driver-2' });

      expect(socket.joinedRooms).not.toContain('driver_room_driver-2');
    });

    it('permite a un administrador suscribirse a la sala de un repartidor', () => {
      const io = createGateway();
      const socket = createSocket({ id: 'admin-1', role: 'ADMIN' });

      connect(io, socket);
      socket.socketClient.emit('driver:subscribe', { driverId: 'driver-2' });

      expect(socket.joinedRooms).toContain('driver_room_driver-2');
    });
  });

  describe('telemetría', () => {
    it('difunde telemetry:location a la sala del pedido con un payload válido', () => {
      const io = createGateway();
      const socket = createSocket({ id: 'driver-1', role: 'DELIVERY_DRIVER' });
      const received: Array<{ payload: any; room: string }> = [];

      connect(io, socket);
      socket.onEmit('telemetry:location', (payload: any, room: string) => {
        received.push({ payload, room });
      });

      socket.socketClient.emit('telemetry:emit', validTelemetry);

      expect(received).toHaveLength(1);
      expect(received[0].room).toBe(`order_room_${ORDER_ID}`);
      expect(received[0].payload).toEqual({
        coords: validTelemetry.coords,
        timestamp: expect.any(Number),
      });
    });

    it('descarta un payload inválido sin emitir telemetry:location', () => {
      const io = createGateway();
      const socket = createSocket({ id: 'driver-1', role: 'DELIVERY_DRIVER' });
      const received: any[] = [];

      connect(io, socket);
      socket.onEmit('telemetry:location', (payload: any) => {
        received.push(payload);
      });

      socket.socketClient.emit('telemetry:emit', {
        orderId: ORDER_ID,
        coords: { lat: 100, lng: -99.1332, accuracy: 5 },
      });

      expect(received).toHaveLength(0);
    });

    it('omite eventos recibidos con menos de 2 segundos de diferencia por socket', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
      const io = createGateway();
      const socket = createSocket({ id: 'driver-1', role: 'DELIVERY_DRIVER' });
      const received: any[] = [];

      connect(io, socket);
      socket.onEmit('telemetry:location', (payload: any) => {
        received.push(payload);
      });

      socket.socketClient.emit('telemetry:emit', validTelemetry);
      nowSpy.mockReturnValue(1_001_500);
      socket.socketClient.emit('telemetry:emit', validTelemetry);

      expect(received).toHaveLength(1);

      nowSpy.mockReturnValue(1_002_001);
      socket.socketClient.emit('telemetry:emit', validTelemetry);

      expect(received).toHaveLength(2);
    });
  });
});

describe('SocketBroadcaster', () => {
  it('emite eventos a la sala indicada mediante broadcastToRoom', () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    const broadcaster = new SocketBroadcaster({ to } as unknown as Server);

    broadcaster.broadcastToRoom('kitchen_room', 'order:new', { orderId: ORDER_ID });

    expect(to).toHaveBeenCalledWith('kitchen_room');
    expect(emit).toHaveBeenCalledWith('order:new', { orderId: ORDER_ID });
  });
});
