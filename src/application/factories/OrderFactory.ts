import { randomUUID } from 'crypto';
import { Order, OrderItem } from '../../domain/entities/Order';
import type { CreateOrderDTO } from '../dtos/CreateOrderDTO';

export class OrderFactory {
  static create(dto: CreateOrderDTO): Order {
    const id = randomUUID();
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BG-${timestamp}-${randomSuffix}`;

    const items = dto.items.map(item => {
      const subtotal = Number((item.quantity * item.unitPrice).toFixed(2));
      return new OrderItem(
        item.productId,
        item.quantity,
        item.unitPrice,
        subtotal,
        item.notes
      );
    });

    const subtotal = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const deliveryFee = Number((dto.deliveryFee ?? 0).toFixed(2));
    const total = Number((subtotal + deliveryFee).toFixed(2));

    return new Order(
      id,
      orderNumber,
      dto.orderType,
      dto.customerId ?? null,
      dto.deliveryAddress ?? null,
      items,
      subtotal,
      deliveryFee,
      total,
      dto.driverId ?? null,
      'PENDING_KITCHEN',
      new Date()
    );
  }
}
