import { randomUUID } from 'crypto';
import { Product } from '../../domain/entities/Product';
import type { IProductRepository } from '../../domain/interfaces';
import type { CreateProductDTO } from '../dtos/CreateProductDTO';
import { NotFoundError } from '../../shared/errors/AppError';

export class ProductFacade {
  constructor(private readonly productRepo: IProductRepository) {}

  async createProduct(dto: CreateProductDTO): Promise<Product> {
    const product = new Product(
      randomUUID(),
      dto.name,
      dto.description,
      dto.price,
      dto.pricingType,
      dto.category,
      dto.imageUrl ?? null,
      true
    );
    return await this.productRepo.save(product);
  }

  async listCatalog(includeUnavailable: boolean = false): Promise<Product[]> {
    return await this.productRepo.findAll(includeUnavailable);
  }

  async getProductById(id: string): Promise<Product | null> {
    return await this.productRepo.findById(id);
  }

  async toggleAvailability(id: string, isAvailable: boolean): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Producto');

    if (isAvailable) {
      product.markInStock();
    } else {
      product.markOutOfStock();
    }
    return await this.productRepo.update(product);
  }

  async softDeleteProduct(id: string): Promise<void> {
    await this.productRepo.softDelete(id);
  }
}
