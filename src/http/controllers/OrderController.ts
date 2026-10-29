import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrderFacade } from '../../application/facades/OrderFacade';
import { PrismaOrderRepository } from '../../infrastructure/db/PrismaOrderRepository';
import { SocketBroadcaster } from '../../infrastructure/websockets/SocketBroadcaster';
import { FcmService } from '../../infrastructure/notifications/FcmService';
import { io } from '../../infrastructure/websockets/io';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import type { OrderStatus } from '../../domain/entities/Order';
import { NotFoundError, UnauthorizedError } from '../../shared/errors/AppError';

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
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = CreateOrderSchema.parse(req.body);
      const facade = getFacade();
      const order = await facade.createOrder({
        ...parsed,
        customerId: req.user?.id ?? null,
      });

      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const facade = getFacade();
      const order = await facade.getOrderById(id);

      if (!order) {
        throw new NotFoundError('Pedido');
      }

      res.json(order);
    } catch (err) {
      next(err);
    }
  },

  async getByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.params;
      const facade = getFacade();
      const orders = await facade.getOrdersByStatus(status as OrderStatus);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

  async advanceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = AdvanceStatusSchema.parse(req.body);
      const customerFcmToken = parsed.customerFcmToken;

      const facade = getFacade();
      const updated = await facade.advanceStatus(id, customerFcmToken);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const facade = getFacade();
      const cancelled = await facade.cancelOrder(id);
      res.json(cancelled);
    } catch (err) {
      next(err);
    }
  },

  async getCustomerHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        throw new UnauthorizedError('No autenticado');
      }

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);

      const facade = getFacade();
      const history = await facade.getCustomerHistory(customerId, { page, limit });
      res.json(history);
    } catch (err) {
      next(err);
    }
  },
};
