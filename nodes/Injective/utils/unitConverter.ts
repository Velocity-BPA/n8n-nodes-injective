/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';

/**
 * Unit Conversion Utilities for Injective
 *
 * Handles conversion between different unit representations:
 * - Base units (smallest denomination, e.g., 1e18 for INJ)
 * - Display units (human-readable, e.g., 1 INJ)
 * - Price units (with specific decimal precision)
 */

// Configure BigNumber for maximum precision
BigNumber.config({
  DECIMAL_PLACES: 36,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  EXPONENTIAL_AT: [-36, 36],
});

/**
 * INJ uses 18 decimal places (like Ethereum)
 */
export const INJ_DECIMALS = 18;

/**
 * Default decimals for common token types
 */
export const TOKEN_DECIMALS = {
  INJ: 18,
  USDT: 6,
  USDC: 6,
  WBTC: 8,
  WETH: 18,
  ATOM: 6,
  OSMO: 6,
} as const;

/**
 * Convert from base units to display units
 *
 * @param amount - Amount in base units (string to handle large numbers)
 * @param decimals - Number of decimal places
 * @returns Display amount as string
 *
 * @example
 * fromBaseUnits('1000000000000000000', 18) // '1'
 * fromBaseUnits('1500000', 6) // '1.5'
 */
export function fromBaseUnits(amount: string | number | BigNumber, decimals: number): string {
  const bn = new BigNumber(amount);
  if (bn.isNaN()) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  return bn.dividedBy(new BigNumber(10).pow(decimals)).toFixed();
}

/**
 * Convert from display units to base units
 *
 * @param amount - Amount in display units
 * @param decimals - Number of decimal places
 * @returns Base amount as string
 *
 * @example
 * toBaseUnits('1', 18) // '1000000000000000000'
 * toBaseUnits('1.5', 6) // '1500000'
 */
export function toBaseUnits(amount: string | number | BigNumber, decimals: number): string {
  const bn = new BigNumber(amount);
  if (bn.isNaN()) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  return bn.multipliedBy(new BigNumber(10).pow(decimals)).integerValue(BigNumber.ROUND_DOWN).toFixed();
}

/**
 * Convert INJ from base units (10^18) to display units
 */
export function fromInj(amount: string | number | BigNumber): string {
  return fromBaseUnits(amount, INJ_DECIMALS);
}

/**
 * Convert INJ from display units to base units (10^18)
 */
export function toInj(amount: string | number | BigNumber): string {
  return toBaseUnits(amount, INJ_DECIMALS);
}

/**
 * Format a price with specific decimal precision
 *
 * @param price - Price value
 * @param precision - Decimal precision (default 6)
 * @returns Formatted price string
 */
export function formatPrice(price: string | number | BigNumber, precision: number = 6): string {
  const bn = new BigNumber(price);
  if (bn.isNaN()) {
    throw new Error(`Invalid price: ${price}`);
  }
  return bn.toFixed(precision);
}

/**
 * Format a quantity with specific decimal precision
 *
 * @param quantity - Quantity value
 * @param precision - Decimal precision (default 4)
 * @returns Formatted quantity string
 */
export function formatQuantity(quantity: string | number | BigNumber, precision: number = 4): string {
  const bn = new BigNumber(quantity);
  if (bn.isNaN()) {
    throw new Error(`Invalid quantity: ${quantity}`);
  }
  return bn.toFixed(precision);
}

/**
 * Calculate percentage change
 *
 * @param oldValue - Original value
 * @param newValue - New value
 * @returns Percentage change as string
 */
export function percentageChange(oldValue: string | number, newValue: string | number): string {
  const old = new BigNumber(oldValue);
  const current = new BigNumber(newValue);

  if (old.isZero()) {
    return current.isZero() ? '0' : '∞';
  }

  return current.minus(old).dividedBy(old).multipliedBy(100).toFixed(2);
}

/**
 * Convert exchange price format to readable format
 * Exchange prices often have specific scaling
 *
 * @param price - Price from exchange
 * @param priceDecimals - Price decimal places
 * @param baseDecimals - Base token decimals
 * @param quoteDecimals - Quote token decimals
 */
export function convertExchangePrice(
  price: string,
  priceDecimals: number,
  baseDecimals: number,
  quoteDecimals: number
): string {
  const bn = new BigNumber(price);
  const decimalDiff = quoteDecimals - baseDecimals;
  return bn
    .dividedBy(new BigNumber(10).pow(priceDecimals))
    .multipliedBy(new BigNumber(10).pow(decimalDiff))
    .toFixed();
}

/**
 * Format large numbers with appropriate suffixes
 *
 * @param value - Number to format
 * @returns Formatted string (e.g., '1.5M', '2.3B')
 */
export function formatLargeNumber(value: string | number | BigNumber): string {
  const bn = new BigNumber(value);
  const abs = bn.abs();

  if (abs.gte(1e12)) {
    return bn.dividedBy(1e12).toFixed(2) + 'T';
  }
  if (abs.gte(1e9)) {
    return bn.dividedBy(1e9).toFixed(2) + 'B';
  }
  if (abs.gte(1e6)) {
    return bn.dividedBy(1e6).toFixed(2) + 'M';
  }
  if (abs.gte(1e3)) {
    return bn.dividedBy(1e3).toFixed(2) + 'K';
  }
  return bn.toFixed(2);
}

/**
 * Calculate margin required for a position
 *
 * @param price - Entry price
 * @param quantity - Position size
 * @param leverage - Leverage multiplier
 * @returns Required margin
 */
export function calculateMargin(
  price: string | number,
  quantity: string | number,
  leverage: number
): string {
  const priceBn = new BigNumber(price);
  const quantityBn = new BigNumber(quantity);
  return priceBn.multipliedBy(quantityBn).dividedBy(leverage).toFixed();
}

/**
 * Calculate liquidation price for a position
 *
 * @param entryPrice - Entry price
 * @param margin - Position margin
 * @param quantity - Position size
 * @param isLong - True for long, false for short
 * @param maintenanceMarginRatio - Maintenance margin ratio (default 0.05 = 5%)
 */
export function calculateLiquidationPrice(
  entryPrice: string | number,
  margin: string | number,
  quantity: string | number,
  isLong: boolean,
  maintenanceMarginRatio: number = 0.05
): string {
  const entry = new BigNumber(entryPrice);
  const marginBn = new BigNumber(margin);
  const qty = new BigNumber(quantity).abs();
  const mmr = new BigNumber(maintenanceMarginRatio);

  if (qty.isZero()) {
    throw new Error('Quantity cannot be zero');
  }

  // Available margin before liquidation
  const availableMargin = marginBn.multipliedBy(new BigNumber(1).minus(mmr));

  if (isLong) {
    // Liq price = entry - (margin * (1 - mmr)) / quantity
    return entry.minus(availableMargin.dividedBy(qty)).toFixed();
  } else {
    // Liq price = entry + (margin * (1 - mmr)) / quantity
    return entry.plus(availableMargin.dividedBy(qty)).toFixed();
  }
}

/**
 * Calculate unrealized PnL
 *
 * @param entryPrice - Entry price
 * @param currentPrice - Current market price
 * @param quantity - Position size (negative for short)
 * @returns Unrealized PnL
 */
export function calculateUnrealizedPnL(
  entryPrice: string | number,
  currentPrice: string | number,
  quantity: string | number
): string {
  const entry = new BigNumber(entryPrice);
  const current = new BigNumber(currentPrice);
  const qty = new BigNumber(quantity);

  return current.minus(entry).multipliedBy(qty).toFixed();
}
