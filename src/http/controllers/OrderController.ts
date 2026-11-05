import { Request, Response, NextFunction } from 'express';
import { OrderFacade } from '../../application/facades/OrderFacade';
import { PrismaOrderRepository } from '../../infrastructure/db/PrismaOrderRepository';
import { SocketBroadcaster } from '../../infrastructure/websockets/SocketBroadcaster';
import { FcmService } from '../../infrastructure/notifications/FcmService';
import { io } from '../../infrastructure/websockets/io';
import { CreateOrderSchema } from '../../application/dtos/CreateOrderDTO';
import {
  AdvanceOrderStatusSchema,
  AssignDriverSchema,
  CancelOrderSchema,
  ListOrdersQuerySchema,
} from '../../application/dtos/OrderDTOs';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import type { OrderStatus } from '../../domain/entities/Order';
import { NotFoundError, UnauthorizedError } from '../../shared/errors/AppError';

const orderRepo = new PrismaOrderRepository();
const fcmService = new FcmService();

const getFacade = () => {
  const broadcaster = new SocketBroadcaster(io);
  return new OrderFacade(orderRepo, broadcaster, fcmService);
};

<<<<<<< HEAD
const CreateOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  notes: z.string().optional(),
});

const CreateOrderSchema = z.object({
  orderType: z.enum(['COUNTER', 'DINE_IN', 'DELIVERY']),
  deliveryAddress: z.string().optional().nullable(),
  deliveryFee: z.number().nonnegative().optional(),
  items: z.array(CreateOrderItemSchema).min(1, 'El pedido debe contener al menos un producto'),
});

const AdvanceStatusSchema = z.object({
  customerFcmToken: z.string().optional(),
});

=======
>>>>>>> feature/BE-07-order-module
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

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ListOrdersQuerySchema.parse(req.query);
      const facade = getFacade();
      const result = await facade.getAll(
        { status: query.status, driverId: query.driverId },
        { page: query.page, limit: query.limit }
      );

      res.json(result);
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
      const parsed = AdvanceOrderStatusSchema.parse(req.body ?? {});
      const customerFcmToken = parsed.customerFcmToken;

      const facade = getFacade();
      const updated = await facade.advanceStatus(id, customerFcmToken);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async assignDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { driverId } = AssignDriverSchema.parse(req.body ?? {});

      const facade = getFacade();
      await facade.assignDriver(id, driverId);

      res.json({ message: 'Repartidor asignado correctamente' });
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      CancelOrderSchema.parse(req.body ?? {});

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

      const query = ListOrdersQuerySchema.parse(req.query);

      const facade = getFacade();
      const history = await facade.getCustomerHistory(customerId, {
        page: query.page,
        limit: query.limit,
      });
      res.json(history);
    } catch (err) {
      next(err);
    }
  },
};
