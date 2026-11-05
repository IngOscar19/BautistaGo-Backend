import type { IOrderStatusState } from '../states/OrderState';
import { stateFromStatus } from '../states/OrderState';
<<<<<<< HEAD
import type { PricingType } from './Product';

<<<<<<< HEAD
import type { PricingType } from './Product';
=======
import { OrderItem } from './OrderItem';

export { OrderItem } from './OrderItem';
>>>>>>> feature/BE-02-domain-entities

export type OrderStatus = 
  | 'PENDING_KITCHEN'
  | 'IN_PREPARATION'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';
=======
export type OrderStatus =
  'PENDING_KITCHEN' | 'IN_PREPARATION' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
>>>>>>> feature/BE-01-project-scaffold

export type OrderType = 'COUNTER' | 'DINE_IN' | 'DELIVERY';

<<<<<<< HEAD
export class OrderItem {
  constructor(
    public readonly productId: string,
    public readonly quantity: number, // Kilos o piezas
    public readonly unitPrice: number,
    public readonly subtotal: number,
    public readonly notes?: string,
<<<<<<< HEAD
    public readonly pricingTypeSnapshot: PricingType = 'BY_PIECE',
=======
    public readonly pricingTypeSnapshot: PricingType = 'BY_PIECE'
>>>>>>> feature/BE-01-project-scaffold
  ) {}

  get unitPriceSnapshot(): number {
    return this.unitPrice;
  }
}

=======
>>>>>>> feature/BE-02-domain-entities
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
    public readonly createdAt: Date = new Date()
  ) {
    this._items = items;
    this._state = stateFromStatus(status);
  }

  get status(): OrderStatus {
    return this._state.getStatus();
  }
  get items(): ReadonlyArray<OrderItem> {
    return this._items;
  }

<<<<<<< HEAD
  total(): number {
    return this._items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  advanceState(): void {
    this._state = this._state.next(this);
  }
  cancel(): void {
    this._state = this._state.cancel(this);
  }
=======
  advanceState(): void { this._state = this._state.next(this); }
  cancel(): void       { this._state = this._state.cancel(this); }
>>>>>>> feature/BE-02-domain-entities
}
