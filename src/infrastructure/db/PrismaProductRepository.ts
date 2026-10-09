import { Decimal } from '@prisma/client/runtime/library';
import type { IProductRepository } from '../../domain/interfaces';
import { Product, type PricingType } from '../../domain/entities/Product';
import { prisma } from './prisma.client';

export class PrismaProductRepository implements IProductRepository {
  async findById(id: string): Promise<Product | null> {
    const row = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(includeUnavailable: boolean = false): Promise<Product[]> {
    const whereClause: { deletedAt: null; isAvailable?: boolean } = { deletedAt: null };
    if (!includeUnavailable) {
      whereClause.isAvailable = true;
    }

    const rows = await prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
    return rows.map(r => this.toDomain(r));
  }

  async save(product: Product): Promise<Product> {
    const row = await prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: new Decimal(product.price),
        pricingType: product.pricingType,
        category: product.category,
        imageUrl: product.imageUrl,
        isAvailable: product.isAvailable,
      },
    });
    return this.toDomain(row);
  }

  async update(product: Product): Promise<Product> {
    const row = await prisma.product.update({
      where: { id: product.id },
      data: {
        name: product.name,
        description: product.description,
        price: new Decimal(product.price),
        pricingType: product.pricingType,
        category: product.category,
        imageUrl: product.imageUrl,
        isAvailable: product.isAvailable,
        deletedAt: product.deletedAt,
      },
    });
    return this.toDomain(row);
  }

  async softDelete(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
    });
  }

  private toDomain(row: any): Product {
    return new Product(
      row.id,
      row.name,
      row.description,
      Number(row.price),
      row.pricingType as PricingType,
      row.category,
      row.imageUrl,
      row.isAvailable,
      row.deletedAt
    );
  }
}
