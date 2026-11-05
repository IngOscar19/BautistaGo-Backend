import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProductFacade } from '../../application/facades/ProductFacade';
import { PrismaProductRepository } from '../../infrastructure/db/PrismaProductRepository';
import { NotFoundError } from '../../shared/errors/AppError';

const facade = new ProductFacade(new PrismaProductRepository());

const ProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  pricingType: z.enum(['BY_WEIGHT_KG', 'BY_WEIGHT_G', 'BY_PIECE']),
  category: z.string().min(2).optional(),
  imageUrl: z.string().url().optional(),
});

export const ProductController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ProductSchema.parse(req.body);
      const product = await facade.createProduct(parsed);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeAll === 'true';
      const products = await facade.listCatalog(includeInactive);
      res.json(products);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await facade.getProductById(id);
      if (!product) {
        throw new NotFoundError('Producto');
      }
      res.json(product);
    } catch (err) {
      next(err);
    }
  },

  async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;
      const updated = await facade.toggleAvailability(id, Boolean(isAvailable));
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async softDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await facade.softDeleteProduct(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
