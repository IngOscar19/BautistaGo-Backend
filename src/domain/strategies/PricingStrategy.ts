import type { PricingType } from '../types/PricingType';
import { BadRequestError } from '../../shared/errors/AppError';

export interface IPricingStrategy {
  calculateSubtotal(quantity: number, unitPrice: number): number;
}

export class ByWeightPricingStrategy implements IPricingStrategy {
  /**
   * Calcula el subtotal para productos vendidos por peso en kilogramos.
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

export class ByWeightGPricingStrategy implements IPricingStrategy {
  /**
   * Calcula el subtotal para productos cuyo peso se captura en gramos.
   * quantity: cantidad en gramos (ej. 500 g)
   * unitPrice: precio por kilogramo
   */
  calculateSubtotal(quantity: number, unitPrice: number): number {
    if (quantity <= 0 || unitPrice <= 0) {
      throw new BadRequestError('La cantidad y el precio por kilo deben ser mayores a 0');
    }
    return Number(((quantity / 1000) * unitPrice).toFixed(2));
  }
}

export class ByPiecePricingStrategy implements IPricingStrategy {
  /**
   * Calcula el subtotal para productos vendidos por pieza / unidad.
   * quantity: cantidad de piezas
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
    this.strategy = PricingStrategyContext.createStrategy(pricingType);
  }

  public setStrategy(strategy: IPricingStrategy): void {
    this.strategy = strategy;
  }

  public calculate(quantity: number, unitPrice: number): number {
    return this.strategy.calculateSubtotal(quantity, unitPrice);
  }

  private static createStrategy(pricingType: PricingType): IPricingStrategy {
    switch (pricingType) {
      case 'BY_WEIGHT_KG':
        return new ByWeightPricingStrategy();
      case 'BY_WEIGHT_G':
        return new ByWeightGPricingStrategy();
      case 'BY_PIECE':
        return new ByPiecePricingStrategy();
    }
  }
}
