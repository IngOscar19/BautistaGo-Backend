import { Request, Response } from 'express';
import { z } from 'zod';
import { OrderFacade } from '../../application/facades/OrderFacade';
import { PrismaOrderRepository } from '../../infrastructure/db/PrismaOrderRepository';
import { SocketBroadcaster } from '../../infrastructure/websockets/SocketBroadcaster';
import { FcmService } from '../../infrastructure/notifications/FcmService';
import { io } from '../../infrastructure/websockets/io';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import type { OrderStatus } from '../../domain/entities/Order';

const orderRepo = new PrismaOrderRepository();
const fcmService = new FcmService();

const getFacade = () => {
  const broadcaster = new SocketBroadcaster(io);
  return new OrderFacade(orderRepo, broadcaster, fcmService);
};

const CreateOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  notes: z.string().optional(),
});

const CreateOrderSchema = z.object({
  orderType: z.enum(['COUNTER', 'DINE_IN', 'DELIVERY']),
  deliveryAddress: z.string().optional().nullable(),
  items: z.array(CreateOrderItemSchema).min(1, 'El pedido debe contener al menos un producto'),
});

const AdvanceStatusSchema = z.object({
  customerFcmToken: z.string().optional(),
});

export const OrderController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const facade = getFacade();
    const order = await facade.createOrder({
      ...parsed.data,
      customerId: req.user?.id ?? null,
    });

    res.status(201).json(order);
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const facade = getFacade();
    const order = await facade.getOrderById(id);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(order);
  },

  async getByStatus(req: Request, res: Response) {
    const { status } = req.params;
    const facade = getFacade();
    const orders = await facade.getOrdersByStatus(status as OrderStatus);
    res.json(orders);
  },

  async advanceStatus(req: Request, res: Response) {
    const { id } = req.params;
    const parsed = AdvanceStatusSchema.safeParse(req.body);
    const customerFcmToken = parsed.success ? parsed.data.customerFcmToken : undefined;

    const facade = getFacade();
    const updated = await facade.advanceStatus(id, customerFcmToken);
    res.json(updated);
  },

  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const facade = getFacade();
    const cancelled = await facade.cancelOrder(id);
    res.json(cancelled);
  },

  async getCustomerHistory(req: AuthenticatedRequest, res: Response) {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);

    const facade = getFacade();
    const history = await facade.getCustomerHistory(customerId, { page, limit });
    res.json(history);
  },
};
