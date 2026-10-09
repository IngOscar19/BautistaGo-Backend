import type { Order, OrderStatus } from '../entities/Order';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByStatus(status: OrderStatus): Promise<Order[]>;
  findByCustomerId(customerId: string, pagination: PaginationParams): Promise<PaginatedResult<Order>>;
  save(order: Order): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
}
