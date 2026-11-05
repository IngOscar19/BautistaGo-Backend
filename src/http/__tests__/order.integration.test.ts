/**
 * Tests de integración del módulo de órdenes (BE-07).
 * Requisitos: PostgreSQL corriendo (docker compose up -d) y migraciones aplicadas.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app';
import { prisma } from '../../infrastructure/db/prisma.client';
import { io } from '../../infrastructure/websockets/io';
import type { UserRole } from '../../domain/entities/User';

const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const jwtSecret = process.env.JWT_SECRET || 'secret';

const userIds: string[] = [];
let customerId = '';
let driverUserId = '';
let productId = '';

let customerToken = '';
let kitchenToken = '';
let adminToken = '';

function signToken(id: string, email: string, role: UserRole): string {
  return jwt.sign({ id, email, role }, jwtSecret, { expiresIn: '1h' });
}

async function createUser(name: string, role: UserRole): Promise<string> {
  const email = `test.order.${name}.${suffix}@bautistago.mx`;
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: 'not-used-in-tests',
      role,
    },
  });
  userIds.push(user.id);
  return user.id;
}

const orderPayload = () => ({
  orderType: 'DELIVERY',
  deliveryAddress: 'Calle Falsa 123, San Miguel de Allende',
  items: [
    {
      productId,
      quantity: 2,
      unitPrice: 25.5,
    },
  ],
});

async function createOrder(): Promise<{ id: string }> {
  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customerToken}`)
    .send(orderPayload());

  if (res.status !== 201) {
    throw new Error(`No se pudo crear la orden de prueba: ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

describe('Order (integración)', () => {
  beforeAll(async () => {
    customerId = await createUser('customer', 'CUSTOMER');
    const kitchenId = await createUser('kitchen', 'KITCHEN_OPERATOR');
    const adminId = await createUser('admin', 'ADMIN');
    driverUserId = await createUser('driver', 'DELIVERY_DRIVER');

    await prisma.deliveryDriver.create({ data: { userId: driverUserId } });

    const product = await prisma.product.create({
      data: {
        name: `Producto test ${suffix}`,
        pricingType: 'BY_PIECE',
        basePrice: 25.5,
      },
    });
    productId = product.id;

    customerToken = signToken(customerId, `customer.${suffix}@bautistago.mx`, 'CUSTOMER');
    kitchenToken = signToken(kitchenId, `kitchen.${suffix}@bautistago.mx`, 'KITCHEN_OPERATOR');
    adminToken = signToken(adminId, `admin.${suffix}@bautistago.mx`, 'ADMIN');
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: {
        OR: [{ customerId: { in: userIds } }, { driverId: { in: userIds } }],
      },
    });
    await prisma.deliveryDriver.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.$disconnect();
  });

  it('POST /api/orders crea un pedido (201)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(orderPayload());

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.orderNumber).toMatch(/^BG-/);
    expect(res.body.status).toBe('PENDING_KITCHEN');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].unitPriceSnapshot).toBe(25.5);
    expect(res.body.items[0].pricingTypeSnapshot).toBe('BY_PIECE');
  });

  it('PATCH /api/orders/:id/status avanza el estado y notifica por WebSocket', async () => {
    const order = await createOrder();

    const emitMock = jest.fn();
    const toSpy = jest.spyOn(io as any, 'to').mockReturnValue({ emit: emitMock } as any);

    try {
      const res = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('IN_PREPARATION');

      expect(toSpy).toHaveBeenCalledWith(`order_room_${order.id}`);
      expect(emitMock).toHaveBeenCalledWith(
        'order:status_changed',
        expect.objectContaining({ orderId: order.id, status: 'IN_PREPARATION' })
      );
    } finally {
      toSpy.mockRestore();
    }
  });

  it('POST /api/orders/:id/cancel cancela un pedido en estado permitido', async () => {
    const order = await createOrder();

    const res = await request(app)
      .post(`/api/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  it('POST /api/orders/:id/cancel respeta las reglas de estado (no cancela en reparto)', async () => {
    const order = await prisma.order.create({
      data: {
        orderNumber: `BG-G${Date.now().toString().slice(-10)}`,
        orderType: 'DELIVERY',
        customerId,
        status: 'OUT_FOR_DELIVERY',
        subtotal: 25.5,
        total: 25.5,
        items: {
          create: [
            {
              productId,
              quantity: 1,
              pricingTypeSnapshot: 'BY_PIECE',
              unitPriceSnapshot: 25.5,
              subtotal: 25.5,
            },
          ],
        },
      },
    });

    const res = await request(app)
      .post(`/api/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No se puede cancelar un pedido en reparto');
  });

  it('GET /api/orders permite filtros/paginación solo a roles autorizados', async () => {
    await createOrder();

    const forbidden = await request(app).get('/api/orders').set('Authorization', `Bearer ${customerToken}`);

    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .get('/api/orders')
      .query({ status: 'PENDING_KITCHEN', page: 1, limit: 20 })
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(allowed.status).toBe(200);
    expect(allowed.body).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        page: 1,
        totalPages: expect.any(Number),
      })
    );
    expect(Array.isArray(allowed.body.data)).toBe(true);
    expect(allowed.body.data.every((order: { status: string }) => order.status === 'PENDING_KITCHEN')).toBe(true);
  });

  it('PATCH /api/orders/:id/assign-driver asigna repartidor y notifica a su canal', async () => {
    const order = await createOrder();

    const emitMock = jest.fn();
    const toSpy = jest.spyOn(io as any, 'to').mockReturnValue({ emit: emitMock } as any);

    try {
      const res = await request(app)
        .patch(`/api/orders/${order.id}/assign-driver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ driverId: driverUserId });

      expect(res.status).toBe(200);

      const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(updatedOrder?.driverId).toBe(driverUserId);

      const driver = await prisma.deliveryDriver.findUnique({ where: { userId: driverUserId } });
      expect(driver?.currentOrderId).toBe(order.id);
      expect(driver?.isAvailable).toBe(false);

      expect(toSpy).toHaveBeenCalledWith(`driver_room_${driverUserId}`);
      expect(emitMock).toHaveBeenCalledWith(
        'order:assigned',
        expect.objectContaining({ orderId: order.id, driverId: driverUserId })
      );
    } finally {
      toSpy.mockRestore();
    }
  });
});
