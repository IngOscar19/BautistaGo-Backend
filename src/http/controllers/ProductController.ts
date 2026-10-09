import { Request, Response } from 'express';
import { z } from 'zod';
import { ProductFacade } from '../../application/facades/ProductFacade';
import { PrismaProductRepository } from '../../infrastructure/db/PrismaProductRepository';

const facade = new ProductFacade(new PrismaProductRepository());

const ProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  pricingType: z.enum(['BY_WEIGHT', 'BY_PIECE']),
  category: z.string().min(2),
  imageUrl: z.string().url().optional(),
});

export const ProductController = {
  async create(req: Request, res: Response) {
    const parsed = ProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const product = await facade.createProduct(parsed.data);
    res.status(201).json(product);
  },

  async list(req: Request, res: Response) {
    const includeInactive = req.query.includeAll === 'true';
    const products = await facade.listCatalog(includeInactive);
    res.json(products);
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const product = await facade.getProductById(id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  },

  async toggleAvailability(req: Request, res: Response) {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const updated = await facade.toggleAvailability(id, Boolean(isAvailable));
    res.json(updated);
  },

  async softDelete(req: Request, res: Response) {
    const { id } = req.params;
    await facade.softDeleteProduct(id);
    res.status(204).send();
  },
};
