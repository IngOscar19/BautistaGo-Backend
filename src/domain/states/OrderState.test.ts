import { Order, OrderItem, type OrderStatus } from '../entities/Order';

function buildOrder(status: OrderStatus = 'PENDING_KITCHEN'): Order {
  const item = new OrderItem('product-1', 2, 50, 100, 'sin cebolla');
  return new Order(
    'order-1',
    'BG-000001',
    'COUNTER',
    'customer-1',
    null,
    [item],
    100,
    0,
    100,
    null,
    status,
    new Date('2026-01-01T00:00:00.000Z')
  );
}

describe('OrderState', () => {
  it('recorre el flujo válido PENDING_KITCHEN → IN_PREPARATION → READY_FOR_PICKUP → OUT_FOR_DELIVERY → DELIVERED', () => {
    const order = buildOrder();

    expect(order.status).toBe('PENDING_KITCHEN');

    const expectedStatuses: OrderStatus[] = ['IN_PREPARATION', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

    for (const expected of expectedStatuses) {
      order.advanceState();
      expect(order.status).toBe(expected);
    }
  });

  it('permite cancelar un pedido antes de salir a reparto', () => {
    const order = buildOrder('READY_FOR_PICKUP');

    order.cancel();

    expect(order.status).toBe('CANCELLED');
  });

  it('prohíbe cancelar un pedido en OUT_FOR_DELIVERY', () => {
    const order = buildOrder('OUT_FOR_DELIVERY');

    expect(() => order.cancel()).toThrow('No se puede cancelar un pedido en reparto');
    expect(order.status).toBe('OUT_FOR_DELIVERY');
  });

  it('impide transiciones posteriores desde DELIVERED', () => {
    const order = buildOrder('DELIVERED');

    expect(() => order.advanceState()).toThrow('Pedido ya entregado');
    expect(() => order.cancel()).toThrow('Pedido ya entregado');
    expect(order.status).toBe('DELIVERED');
  });

  it('impide transiciones posteriores desde CANCELLED', () => {
    const order = buildOrder('CANCELLED');

    expect(() => order.advanceState()).toThrow('Pedido ya cancelado');
    expect(() => order.cancel()).toThrow('Pedido ya cancelado');
    expect(order.status).toBe('CANCELLED');
  });
});
