import { Decimal } from '@prisma/client/runtime/library';
import type { IOrderRepository, OrderFilters, PaginationParams, PaginatedResult } from '../../domain/interfaces';
import { Order, OrderItem, type OrderStatus, type OrderType } from '../../domain/entities/Order';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError';
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
      where: { status },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(r => this.toDomain(r));
  }

  async findByCustomerId(customerId: string, pagination: PaginationParams): Promise<PaginatedResult<Order>> {
    const skip = (pagination.page - 1) * pagination.limit;
    const [total, rows] = await prisma.$transaction([
      prisma.order.count({ where: { customerId } }),
      prisma.order.findMany({
        where: { customerId },
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

  async findAll(filters: OrderFilters, pagination: PaginationParams): Promise<PaginatedResult<Order>> {
    const where = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.driverId ? { driverId: filters.driverId } : {}),
    };
    const skip = (pagination.page - 1) * pagination.limit;

    const [total, rows] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
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
        driverId: order.driverId,
        deliveryAddress: order.deliveryAddress,
        status: order.status,
        subtotal: new Decimal(order.subtotal),
        deliveryFee: new Decimal(order.deliveryFee),
        total: new Decimal(order.total),
        items: {
          create: order.items.map(i => ({
            productId: i.productId,
            quantity: new Decimal(i.quantity),
            pricingTypeSnapshot: i.pricingTypeSnapshot,
            unitPriceSnapshot: new Decimal(i.unitPriceSnapshot),
            subtotal: new Decimal(i.subtotal),
            notes: i.notes,
          })),
        },
      },
      include: { items: true },
    });
    return this.toDomain(row);
  }

  async updateStatus(id: string, status: OrderStatus, expectedVersion?: number): Promise<void> {
    if (expectedVersion !== undefined) {
      const result = await prisma.order.updateMany({
        where: { id, version: expectedVersion },
        data: { status, version: { increment: 1 } },
      });
      if (result.count === 0) {
        throw new ConflictError('Conflicto: el pedido fue modificado por otra solicitud simultánea');
      }
      return;
    }

    await prisma.order.update({
      where: { id },
      data: { status, version: { increment: 1 } },
    });
  }

  async assignDriver(orderId: string, driverId: string): Promise<void> {
    const driver = await prisma.deliveryDriver.findUnique({
      where: { userId: driverId },
    });

    if (!driver) {
      throw new NotFoundError('Repartidor');
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { driverId },
      }),
      prisma.deliveryDriver.update({
        where: { userId: driverId },
        data: { currentOrderId: orderId, isAvailable: false },
      }),
    ]);
  }

  private toDomain(row: any): Order {
    const items = row.items.map(
      (i: any) =>
        new OrderItem(
          i.productId,
          Number(i.quantity),
          Number(i.unitPriceSnapshot ?? i.unitPrice),
          Number(i.subtotal),
          i.notes,
          i.pricingTypeSnapshot ?? 'BY_PIECE'
        )
    );
    return new Order(
      row.id,
      row.orderNumber,
      row.orderType as OrderType,
      row.customerId,
      row.deliveryAddress,
      items,
      Number(row.subtotal),
      Number(row.deliveryFee),
      Number(row.total),
      row.driverId,
      row.status as OrderStatus,
      row.createdAt,
      row.version ?? 0
    );
  }
}
