export class OrderItem {
  constructor(
    public readonly productId: string,
    public readonly quantity: number, // Kilos, gramos o piezas según el tipo de precio
    public readonly unitPrice: number,
    public readonly subtotal: number,
    public readonly notes?: string,
  ) {}
}
