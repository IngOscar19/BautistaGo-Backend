import { Product } from './Product';

describe('Product', () => {
  const buildProduct = (): Product =>
    new Product('prod-1', 'Carnitas', 'Carnitas de cerdo', 250, 'BY_WEIGHT_KG', 'Platillos');

  it('marca el producto fuera de stock', () => {
    const product = buildProduct();

    product.markOutOfStock();

    expect(product.isAvailable).toBe(false);
  });

  it('marca el producto disponible nuevamente', () => {
    const product = buildProduct();
    product.markOutOfStock();

    product.markInStock();

    expect(product.isAvailable).toBe(true);
  });

  it('aplica soft delete y restaura el producto', () => {
    const product = buildProduct();

    product.softDelete();

    expect(product.deletedAt).toBeInstanceOf(Date);

    product.restore();

    expect(product.deletedAt).toBeNull();
  });
});
