import type { OrderType } from '../../domain/entities/Order';

export interface CreateOrderItemDTO {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface CreateOrderDTO {
  orderType: OrderType;
  customerId?: string | null;
  deliveryAddress?: string | null;
  items: CreateOrderItemDTO[];
}
