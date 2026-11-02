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
      return new OrderItem(item.productId, item.quantity, item.unitPrice, subtotal, item.notes);
    });

    return new Order(
      id,
      orderNumber,
      dto.orderType,
      dto.customerId ?? null,
      dto.deliveryAddress ?? null,
      items,
      'PENDING_KITCHEN',
      new Date()
    );
  }
}
