import { z } from 'zod';

export const PricingTypeSnapshotSchema = z.enum([
  'BY_WEIGHT_KG',
  'BY_WEIGHT_G',
  'BY_PIECE',
]);

export const CreateOrderItemSchema = z.object({
  productId: z.string().uuid('productId debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number().positive('El precio unitario debe ser mayor a 0'),
  pricingTypeSnapshot: PricingTypeSnapshotSchema.optional(),
  notes: z.string().trim().max(500).optional(),
});

export const CreateOrderSchema = z.object({
  orderType: z.enum(['COUNTER', 'DINE_IN', 'DELIVERY']),
  customerId: z.string().uuid().optional().nullable(),
  deliveryAddress: z.string().trim().max(500).optional().nullable(),
  deliveryLat: z.number().min(-90).max(90).optional().nullable(),
  deliveryLng: z.number().min(-180).max(180).optional().nullable(),
  deliveryFee: z.number().nonnegative().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  items: z.array(CreateOrderItemSchema).min(1, 'El pedido debe contener al menos un producto'),
});

export type CreateOrderItemDTO = z.infer<typeof CreateOrderItemSchema>;
export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;
