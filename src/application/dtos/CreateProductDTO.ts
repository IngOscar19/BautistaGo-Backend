import type { PricingType } from '../../domain/entities/Product';

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  pricingType: PricingType;
  category: string;
  imageUrl?: string | null;
}
