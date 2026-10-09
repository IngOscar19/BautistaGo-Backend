import { Decimal } from '@prisma/client/runtime/library';
import type { IOrderRepository, PaginationParams, PaginatedResult } from '../../domain/interfaces';
import { Order, OrderItem, type OrderStatus, type OrderType } from '../../domain/entities/Order';
import { prisma } from './prisma.client';

export class PrismaOrderRepository implements IOrderRepository {
  async findById(id: string): Promise<Order | null> {
    const row = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      where: { status, deletedAt: null },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(r => this.toDomain(r));
  }

  async findByCustomerId(customerId: string, pagination: PaginationParams): Promise<PaginatedResult<Order>> {
    const skip = (pagination.page - 1) * pagination.limit;
    const [total, rows] = await prisma.$transaction([
      prisma.order.count({ where: { customerId, deletedAt: null } }),
      prisma.order.findMany({
        where: { customerId, deletedAt: null },
        include: { items: true },
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: rows.map(r => this.toDomain(r)),
      total,
      page: pagination.page,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async save(order: Order): Promise<Order> {
    // Procesamiento transaccional ACID (RF2, RF 3.2.10)
    const row = await prisma.order.create({
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        customerId: order.customerId,
        deliveryAddress: order.deliveryAddress,
        status: order.status,
        subtotal: new Decimal(order.total()),
        total: new Decimal(order.total()),
        items: {
          create: order.items.map(i => ({
            productId: i.productId,
            quantity: new Decimal(i.quantity),
            unitPrice: new Decimal(i.unitPrice),
            subtotal: new Decimal(i.subtotal),
            notes: i.notes,
          })),
        },
      },
      include: { items: true },
    });
    return this.toDomain(row);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  private toDomain(row: any): Order {
    const items = row.items.map((i: any) =>
      new OrderItem(i.productId, Number(i.quantity), Number(i.unitPrice), Number(i.subtotal), i.notes)
    );
    return new Order(
      row.id,
      row.orderNumber,
      row.orderType as OrderType,
      row.customerId,
      row.deliveryAddress,
      items,
      row.status as OrderStatus,
      row.createdAt
    );
  }
}
