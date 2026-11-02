import type {
  IOrderRepository,
  IWebSocketBroadcaster,
  INotificationService,
  PaginationParams,
  PaginatedResult,
} from '../../domain/interfaces';
import type { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderFactory } from '../factories/OrderFactory';
import type { CreateOrderDTO } from '../dtos/CreateOrderDTO';

export class OrderFacade {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly broadcaster: IWebSocketBroadcaster,
    private readonly notifications?: INotificationService
  ) {}

  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    const order = OrderFactory.create(dto);
    const savedOrder = await this.orderRepo.save(order);

    // Alerta inmediata a pantalla de cocina (RF3)
    this.broadcaster.broadcastToRoom('kitchen_room', 'order:new', {
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      items: savedOrder.items,
    });

    return savedOrder;
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return await this.orderRepo.findById(orderId);
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return await this.orderRepo.findByStatus(status);
  }

  async advanceStatus(orderId: string, customerFcmToken?: string): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error(`Pedido ${orderId} no encontrado`);

    order.advanceState();
    await this.orderRepo.updateStatus(orderId, order.status);

    // Notificación en tiempo real a clientes conectados
    this.broadcaster.broadcastToRoom(`order_room_${orderId}`, 'order:status_changed', {
      orderId,
      status: order.status,
    });

    if (customerFcmToken && this.notifications) {
      await this.notifications.sendPush(
        customerFcmToken,
        'Actualización de tu pedido',
        `El pedido ahora está: ${order.status}`,
        { orderId }
      );
    }

    return order;
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error(`Pedido ${orderId} no encontrado`);

    order.cancel();
    await this.orderRepo.updateStatus(orderId, order.status);

    this.broadcaster.broadcastToRoom(`order_room_${orderId}`, 'order:status_changed', {
      orderId,
      status: order.status,
    });

    return order;
  }

  async getCustomerHistory(customerId: string, pagination: PaginationParams): Promise<PaginatedResult<Order>> {
    return await this.orderRepo.findByCustomerId(customerId, pagination);
  }
}
