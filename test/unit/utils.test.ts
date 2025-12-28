/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  fromBaseUnits,
  toBaseUnits,
  fromInj,
  toInj,
  formatPrice,
  calculateMargin,
  calculateLiquidationPrice,
} from '../../nodes/Injective/utils/unitConverter';

import {
  validateOrder,
  generateOrderHash,
  calculateNotionalValue,
  isOrderFillable,
  getRemainingQuantity,
} from '../../nodes/Injective/utils/orderUtils';

import {
  calculateMidPrice,
  calculateSpread,
  estimateExecutionPrice,
  roundToTickSize,
} from '../../nodes/Injective/utils/marketUtils';

import { ORDER_TYPES, ORDER_SIDES, ORDER_STATES } from '../../nodes/Injective/constants/markets';

describe('Unit Converter Utils', () => {
  describe('fromBaseUnits', () => {
    it('should convert from base units to display units', () => {
      expect(fromBaseUnits('1000000000000000000', 18)).toBe('1');
      expect(fromBaseUnits('1500000', 6)).toBe('1.5');
      expect(fromBaseUnits('500000000000000000', 18)).toBe('0.5');
    });

    it('should handle zero', () => {
      expect(fromBaseUnits('0', 18)).toBe('0');
    });

    it('should throw on invalid input', () => {
      expect(() => fromBaseUnits('invalid', 18)).toThrow();
    });
  });

  describe('toBaseUnits', () => {
    it('should convert from display units to base units', () => {
      expect(toBaseUnits('1', 18)).toBe('1000000000000000000');
      expect(toBaseUnits('1.5', 6)).toBe('1500000');
    });

    it('should handle decimals correctly', () => {
      expect(toBaseUnits('0.5', 18)).toBe('500000000000000000');
    });
  });

  describe('fromInj / toInj', () => {
    it('should convert INJ correctly', () => {
      expect(fromInj('1000000000000000000')).toBe('1');
      expect(toInj('1')).toBe('1000000000000000000');
    });
  });

  describe('formatPrice', () => {
    it('should format price with precision', () => {
      expect(formatPrice('123.456789', 2)).toBe('123.46');
      expect(formatPrice('123.456789', 4)).toBe('123.4568');
    });
  });

  describe('calculateMargin', () => {
    it('should calculate required margin', () => {
      const margin = calculateMargin('100', '10', 5);
      expect(margin).toBe('200'); // 100 * 10 / 5 = 200
    });
  });

  describe('calculateLiquidationPrice', () => {
    it('should calculate liquidation price for long position', () => {
      const liqPrice = calculateLiquidationPrice('100', '20', '1', true, 0.05);
      expect(parseFloat(liqPrice)).toBeCloseTo(81, 0);
    });

    it('should calculate liquidation price for short position', () => {
      const liqPrice = calculateLiquidationPrice('100', '20', '1', false, 0.05);
      expect(parseFloat(liqPrice)).toBeCloseTo(119, 0);
    });
  });
});

describe('Order Utils', () => {
  describe('validateOrder', () => {
    it('should validate a valid order', () => {
      const result = validateOrder({
        marketId: '0x' + '0'.repeat(64),
        subaccountId: '0x' + '0'.repeat(64),
        orderType: ORDER_TYPES.LIMIT,
        side: ORDER_SIDES.BUY,
        price: '100',
        quantity: '10',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid market ID', () => {
      const result = validateOrder({
        marketId: 'invalid',
        subaccountId: '0x' + '0'.repeat(64),
        orderType: ORDER_TYPES.LIMIT,
        side: ORDER_SIDES.BUY,
        price: '100',
        quantity: '10',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid market ID format');
    });

    it('should reject negative quantity', () => {
      const result = validateOrder({
        marketId: '0x' + '0'.repeat(64),
        subaccountId: '0x' + '0'.repeat(64),
        orderType: ORDER_TYPES.LIMIT,
        side: ORDER_SIDES.BUY,
        price: '100',
        quantity: '-10',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quantity must be a positive number');
    });
  });

  describe('generateOrderHash', () => {
    it('should generate a valid order hash', () => {
      const hash = generateOrderHash();
      expect(hash).toMatch(/^0x[a-f0-9]+$/);
      expect(hash.length).toBe(66);
    });

    it('should generate unique hashes', () => {
      const hash1 = generateOrderHash();
      const hash2 = generateOrderHash();
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('calculateNotionalValue', () => {
    it('should calculate notional value correctly', () => {
      expect(calculateNotionalValue('100', '10')).toBe('1000');
      expect(calculateNotionalValue('50.5', '20')).toBe('1010');
    });
  });

  describe('isOrderFillable', () => {
    it('should return true for booked orders', () => {
      expect(isOrderFillable(ORDER_STATES.BOOKED)).toBe(true);
    });

    it('should return false for filled orders', () => {
      expect(isOrderFillable(ORDER_STATES.FILLED)).toBe(false);
    });
  });

  describe('getRemainingQuantity', () => {
    it('should calculate remaining quantity', () => {
      expect(getRemainingQuantity('100', '30')).toBe('70');
      expect(getRemainingQuantity('100', '100')).toBe('0');
    });
  });
});

describe('Market Utils', () => {
  const mockOrderbook = {
    bids: [
      { price: '99', quantity: '10' },
      { price: '98', quantity: '20' },
    ],
    asks: [
      { price: '101', quantity: '10' },
      { price: '102', quantity: '20' },
    ],
    timestamp: Date.now(),
  };

  describe('calculateMidPrice', () => {
    it('should calculate mid price correctly', () => {
      const midPrice = calculateMidPrice(mockOrderbook);
      expect(midPrice).toBe('100');
    });

    it('should return 0 for empty orderbook', () => {
      const emptyOrderbook = { bids: [], asks: [], timestamp: Date.now() };
      expect(calculateMidPrice(emptyOrderbook)).toBe('0');
    });
  });

  describe('calculateSpread', () => {
    it('should calculate spread correctly', () => {
      const spread = calculateSpread(mockOrderbook);
      expect(spread.absolute).toBe('2');
      expect(parseFloat(spread.percentage)).toBeCloseTo(2, 0);
    });
  });

  describe('estimateExecutionPrice', () => {
    it('should estimate execution price for buy order', () => {
      const result = estimateExecutionPrice(mockOrderbook, '10', 'buy');
      expect(result).not.toBeNull();
      expect(result?.averagePrice).toBe('101');
    });

    it('should return null for insufficient liquidity', () => {
      const result = estimateExecutionPrice(mockOrderbook, '1000', 'buy');
      expect(result).toBeNull();
    });
  });

  describe('roundToTickSize', () => {
    it('should round to tick size', () => {
      expect(roundToTickSize('100.123', '0.01', 'nearest')).toBe('100.12');
      expect(roundToTickSize('100.126', '0.01', 'nearest')).toBe('100.13');
    });
  });
});
