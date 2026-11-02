import type { IOrderStatusState } from '../states/OrderState';
import { stateFromStatus } from '../states/OrderState';
import { OrderItem } from './OrderItem';

export { OrderItem } from './OrderItem';

export type OrderStatus = 
  | 'PENDING_KITCHEN'
  | 'IN_PREPARATION'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderType = 'COUNTER' | 'DINE_IN' | 'DELIVERY';

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
    public readonly subtotal: number,
    public readonly deliveryFee: number,
    public readonly total: number,
    public readonly driverId: string | null,
    status: OrderStatus = 'PENDING_KITCHEN',
    public readonly createdAt: Date = new Date(),
  ) {
    this._items = items;
    this._state = stateFromStatus(status);
  }

  get status(): OrderStatus { return this._state.getStatus(); }
  get items(): ReadonlyArray<OrderItem> { return this._items; }

  advanceState(): void { this._state = this._state.next(this); }
  cancel(): void       { this._state = this._state.cancel(this); }
}
