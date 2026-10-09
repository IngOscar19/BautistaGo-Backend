export type PricingType = 'BY_WEIGHT' | 'BY_PIECE';

export class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public price: number,
    public pricingType: PricingType,
    public category: string,
    public imageUrl: string | null = null,
    public isAvailable: boolean = true,
    public deletedAt: Date | null = null,
  ) {}

  markOutOfStock(): void {
    this.isAvailable = false;
  }

  markInStock(): void {
    this.isAvailable = true;
  }

  softDelete(): void {
    this.deletedAt = new Date();
  }

  restore(): void {
    this.deletedAt = null;
  }
}
