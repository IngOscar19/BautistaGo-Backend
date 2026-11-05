import type { Order, OrderStatus } from '../entities/Order';
import { BadRequestError } from '../../shared/errors/AppError';

export interface IOrderStatusState {
  next(order: Order): IOrderStatusState;
  cancel(order: Order): IOrderStatusState;
  getStatus(): OrderStatus;
}

export class PendingKitchenState implements IOrderStatusState {
<<<<<<< HEAD
  getStatus(): OrderStatus { return 'PENDING_KITCHEN'; }
  next(_o: Order): IOrderStatusState { return new InPreparationState(); }
  cancel(_o: Order): IOrderStatusState { return new CancelledState(); }
}

export class InPreparationState implements IOrderStatusState {
  getStatus(): OrderStatus { return 'IN_PREPARATION'; }
  next(_o: Order): IOrderStatusState { return new ReadyForPickupState(); }
  cancel(_o: Order): IOrderStatusState { return new CancelledState(); }
}

export class ReadyForPickupState implements IOrderStatusState {
  getStatus(): OrderStatus { return 'READY_FOR_PICKUP'; }
  next(_o: Order): IOrderStatusState { return new OutForDeliveryState(); }
  cancel(_o: Order): IOrderStatusState { return new CancelledState(); }
}

export class OutForDeliveryState implements IOrderStatusState {
  getStatus(): OrderStatus { return 'OUT_FOR_DELIVERY'; }
  next(_o: Order): IOrderStatusState { return new DeliveredState(); }
  cancel(_o: Order): IOrderStatusState {
<<<<<<< HEAD
    throw new BadRequestError('No se puede cancelar un pedido en reparto');
=======
  getStatus(): OrderStatus {
    return 'PENDING_KITCHEN';
  }
  next(_o: Order): IOrderStatusState {
    return new InPreparationState();
  }
  cancel(_o: Order): IOrderStatusState {
    return new CancelledState();
  }
}

export class InPreparationState implements IOrderStatusState {
  getStatus(): OrderStatus {
    return 'IN_PREPARATION';
  }
  next(_o: Order): IOrderStatusState {
    return new ReadyForPickupState();
  }
  cancel(_o: Order): IOrderStatusState {
    return new CancelledState();
  }
}

export class ReadyForPickupState implements IOrderStatusState {
  getStatus(): OrderStatus {
    return 'READY_FOR_PICKUP';
  }
  next(_o: Order): IOrderStatusState {
    return new OutForDeliveryState();
  }
  cancel(_o: Order): IOrderStatusState {
    return new CancelledState();
  }
}

export class OutForDeliveryState implements IOrderStatusState {
  getStatus(): OrderStatus {
    return 'OUT_FOR_DELIVERY';
  }
  next(_o: Order): IOrderStatusState {
    return new DeliveredState();
  }
  cancel(_o: Order): IOrderStatusState {
=======
>>>>>>> feature/BE-02-domain-entities
    throw new Error('No se puede cancelar un pedido en reparto');
>>>>>>> feature/BE-01-project-scaffold
  }
}

export class DeliveredState implements IOrderStatusState {
<<<<<<< HEAD
  getStatus(): OrderStatus { return 'DELIVERED'; }
<<<<<<< HEAD
  next(_o: Order): IOrderStatusState { throw new BadRequestError('Pedido ya entregado'); }
  cancel(_o: Order): IOrderStatusState { throw new BadRequestError('Pedido ya entregado'); }
=======
  next(_o: Order): IOrderStatusState { throw new Error('Pedido ya entregado'); }
  cancel(_o: Order): IOrderStatusState { throw new Error('Pedido ya entregado'); }
>>>>>>> feature/BE-02-domain-entities
}

export class CancelledState implements IOrderStatusState {
  getStatus(): OrderStatus { return 'CANCELLED'; }
<<<<<<< HEAD
  next(_o: Order): IOrderStatusState { throw new BadRequestError('Pedido ya cancelado'); }
  cancel(_o: Order): IOrderStatusState { throw new BadRequestError('Pedido ya cancelado'); }
=======
  getStatus(): OrderStatus {
    return 'DELIVERED';
  }
  next(_o: Order): IOrderStatusState {
    throw new Error('Pedido ya entregado');
  }
  cancel(_o: Order): IOrderStatusState {
    throw new Error('Pedido ya entregado');
  }
}

export class CancelledState implements IOrderStatusState {
  getStatus(): OrderStatus {
    return 'CANCELLED';
  }
  next(_o: Order): IOrderStatusState {
    throw new Error('Pedido ya cancelado');
  }
  cancel(_o: Order): IOrderStatusState {
    throw new Error('Pedido ya cancelado');
  }
>>>>>>> feature/BE-01-project-scaffold
=======
  next(_o: Order): IOrderStatusState { throw new Error('Pedido ya cancelado'); }
  cancel(_o: Order): IOrderStatusState { throw new Error('Pedido ya cancelado'); }
>>>>>>> feature/BE-02-domain-entities
}

export function stateFromStatus(status: OrderStatus): IOrderStatusState {
  switch (status) {
    case 'PENDING_KITCHEN':
      return new PendingKitchenState();
    case 'IN_PREPARATION':
      return new InPreparationState();
    case 'READY_FOR_PICKUP':
      return new ReadyForPickupState();
    case 'OUT_FOR_DELIVERY':
      return new OutForDeliveryState();
    case 'DELIVERED':
      return new DeliveredState();
    case 'CANCELLED':
      return new CancelledState();
  }
}
