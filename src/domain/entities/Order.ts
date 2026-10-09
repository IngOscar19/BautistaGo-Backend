import type { IOrderStatusState } from '../states/OrderState';
import { stateFromStatus } from '../states/OrderState';

export type OrderStatus = 
  | 'PENDING_KITCHEN'
  | 'IN_PREPARATION'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderType = 'COUNTER' | 'DINE_IN' | 'DELIVERY';

export class OrderItem {
  constructor(
    public readonly productId: string,
    public readonly quantity: number, // Kilos o piezas
    public readonly unitPrice: number,
    public readonly subtotal: number,
    public readonly notes?: string,
  ) {}
}

export class Order {
  private _state: IOrderStatusState;
  private _items: OrderItem[] = [];

  constructor(
    public readonly id: string,
    public readonly orderNumber: string,
    public readonly orderType: OrderType,
    public readonly customerId: string | null,
    public readonly deliveryAddress: string | null,
    items: OrderItem[],
    status: OrderStatus = 'PENDING_KITCHEN',
    public readonly createdAt: Date = new Date(),
  ) {
    this._items = items;
    this._state = stateFromStatus(status);
  }

  get status(): OrderStatus { return this._state.getStatus(); }
  get items(): ReadonlyArray<OrderItem> { return this._items; }

  total(): number {
    return this._items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  advanceState(): void { this._state = this._state.next(this); }
  cancel(): void       { this._state = this._state.cancel(this); }
}
