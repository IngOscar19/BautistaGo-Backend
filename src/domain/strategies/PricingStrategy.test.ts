import {
  ByPiecePricingStrategy,
  ByWeightGPricingStrategy,
  ByWeightPricingStrategy,
  PricingStrategyContext,
} from './PricingStrategy';

describe('PricingStrategy', () => {
  describe('cálculo por kilogramo', () => {
    it('calcula 1.5 kg a 100 por kg', () => {
      const strategy = new ByWeightPricingStrategy();

      expect(strategy.calculateSubtotal(1.5, 100)).toBe(150);
    });

    it('admite cantidades decimales y redondea a 2 decimales', () => {
      const strategy = new ByWeightPricingStrategy();

      expect(strategy.calculateSubtotal(0.33, 19.99)).toBe(6.6);
    });

    it('rechaza cantidades o precios no positivos', () => {
      const strategy = new ByWeightPricingStrategy();

      expect(() => strategy.calculateSubtotal(0, 100)).toThrow();
      expect(() => strategy.calculateSubtotal(1, 0)).toThrow();
    });
  });

  describe('cálculo por gramo', () => {
    it('convierte gramos a kilogramos antes de multiplicar', () => {
      const strategy = new ByWeightGPricingStrategy();

      expect(strategy.calculateSubtotal(500, 100)).toBe(50);
    });

    it('rechaza cantidades o precios no positivos', () => {
      const strategy = new ByWeightGPricingStrategy();

      expect(() => strategy.calculateSubtotal(-1, 100)).toThrow();
      expect(() => strategy.calculateSubtotal(500, -100)).toThrow();
    });
  });

  describe('cálculo por pieza', () => {
    it('calcula 3 piezas a 25 cada una', () => {
      const strategy = new ByPiecePricingStrategy();

      expect(strategy.calculateSubtotal(3, 25)).toBe(75);
    });

    it('rechaza cantidades o precios no positivos', () => {
      const strategy = new ByPiecePricingStrategy();

      expect(() => strategy.calculateSubtotal(0, 25)).toThrow();
      expect(() => strategy.calculateSubtotal(3, 0)).toThrow();
    });
  });

  describe('PricingStrategyContext', () => {
    it('selecciona la estrategia por kilogramo', () => {
      const context = new PricingStrategyContext('BY_WEIGHT_KG');

      expect(context.calculate(2, 30)).toBe(60);
    });

    it('selecciona la estrategia por gramo', () => {
      const context = new PricingStrategyContext('BY_WEIGHT_G');

      expect(context.calculate(250, 80)).toBe(20);
    });

    it('selecciona la estrategia por pieza', () => {
      const context = new PricingStrategyContext('BY_PIECE');

      expect(context.calculate(4, 15)).toBe(60);
    });
  });
});
