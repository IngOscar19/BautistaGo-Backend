import { z } from 'zod';

const OrderStatusSchema = z.enum([
  'PENDING_KITCHEN',
  'IN_PREPARATION',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);

export const AdvanceOrderStatusSchema = z.object({
  customerFcmToken: z.string().trim().min(1).optional(),
});

export const AssignDriverSchema = z.object({
  driverId: z.string().uuid('driverId debe ser un UUID válido'),
});

export const CancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const ListOrdersQuerySchema = z.object({
  status: OrderStatusSchema.optional(),
  driverId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdvanceOrderStatusDTO = z.infer<typeof AdvanceOrderStatusSchema>;
export type AssignDriverDTO = z.infer<typeof AssignDriverSchema>;
export type CancelOrderDTO = z.infer<typeof CancelOrderSchema>;
export type ListOrdersQueryDTO = z.infer<typeof ListOrdersQuerySchema>;
