import type { PricingType } from '../entities/Product';
import { BadRequestError } from '../../shared/errors/AppError';

export interface IPricingStrategy {
  calculateSubtotal(quantity: number, unitPrice: number): number;
}

export class ByWeightPricingStrategy implements IPricingStrategy {
  /**
   * Calcula el subtotal para productos vendidos por peso (ej. kg)
   * quantity: cantidad en kg (admite decimales, ej. 0.5 kg)
   * unitPrice: precio por kilogramo
   */
  calculateSubtotal(quantity: number, unitPrice: number): number {
    if (quantity <= 0 || unitPrice <= 0) {
      throw new BadRequestError('La cantidad y el precio por kilo deben ser mayores a 0');
    }
    return Number((quantity * unitPrice).toFixed(2));
  }
}

export class ByPiecePricingStrategy implements IPricingStrategy {
  /**
   * Calcula el subtotal para productos vendidos por pieza / unidad
   * quantity: cantidad de piezas (debe ser entero positivo)
   * unitPrice: precio por pieza
   */
  calculateSubtotal(quantity: number, unitPrice: number): number {
    if (quantity <= 0 || unitPrice <= 0) {
      throw new BadRequestError('La cantidad y el precio por pieza deben ser mayores a 0');
    }
    return Number((quantity * unitPrice).toFixed(2));
  }
}

export class PricingStrategyContext {
  private strategy: IPricingStrategy;

  constructor(pricingType: PricingType) {
    this.strategy = (pricingType === 'BY_WEIGHT_KG' || pricingType === 'BY_WEIGHT_G')
      ? new ByWeightPricingStrategy() 
      : new ByPiecePricingStrategy();
  }

  public setStrategy(strategy: IPricingStrategy): void {
    this.strategy = strategy;
  }

  public calculate(quantity: number, unitPrice: number): number {
    return this.strategy.calculateSubtotal(quantity, unitPrice);
  }
}
