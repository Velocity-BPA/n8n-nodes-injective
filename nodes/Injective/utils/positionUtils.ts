/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';
import { POSITION_DIRECTIONS, MAX_LEVERAGE } from '../constants/markets';

/**
 * Position Utilities for Injective Derivatives
 *
 * Helpers for calculating position metrics, PnL, liquidation prices,
 * and other derivatives-specific calculations.
 */

export interface Position {
  marketId: string;
  subaccountId: string;
  direction: string;
  quantity: string;
  entryPrice: string;
  margin: string;
  cumulativeFundingEntry: string;
  markPrice?: string;
}

export interface PositionMetrics {
  notionalValue: string;
  effectiveLeverage: string;
  unrealizedPnl: string;
  unrealizedPnlPercent: string;
  liquidationPrice: string;
  marginRatio: string;
  availableMargin: string;
}

/**
 * Maintenance margin ratio (5%)
 * This is the minimum margin ratio before liquidation
 */
export const MAINTENANCE_MARGIN_RATIO = 0.05;

/**
 * Calculate liquidation price for a position
 */
export function calculateLiquidationPrice(position: Position): BigNumber {
  const entryPrice = new BigNumber(position.entryPrice);
  const quantity = new BigNumber(position.quantity).abs();
  const margin = new BigNumber(position.margin);
  const isLong = position.direction === POSITION_DIRECTIONS.LONG;

  if (quantity.isZero()) {
    return new BigNumber(0);
  }

  // Available margin for loss before liquidation
  const availableForLoss = margin.multipliedBy(1 - MAINTENANCE_MARGIN_RATIO);

  // Price movement per unit quantity that consumes available margin
  const priceMovement = availableForLoss.dividedBy(quantity);

  if (isLong) {
    // Long: liquidate when price drops
    return entryPrice.minus(priceMovement);
  } else {
    // Short: liquidate when price rises
    return entryPrice.plus(priceMovement);
  }
}

/**
 * Calculate position metrics
 */
export function calculatePositionMetrics(
  position: Position,
  currentPrice: string
): PositionMetrics {
  const entryPrice = new BigNumber(position.entryPrice);
  const markPrice = new BigNumber(currentPrice);
  const quantity = new BigNumber(position.quantity).abs();
  const margin = new BigNumber(position.margin);
  const isLong = position.direction === POSITION_DIRECTIONS.LONG;

  // Notional value = quantity * mark price
  const notionalValue = quantity.multipliedBy(markPrice);

  // Effective leverage = notional / margin
  const effectiveLeverage = margin.isZero()
    ? new BigNumber(0)
    : notionalValue.dividedBy(margin);

  // Unrealized PnL
  const priceDiff = isLong
    ? markPrice.minus(entryPrice)
    : entryPrice.minus(markPrice);
  const unrealizedPnl = priceDiff.multipliedBy(quantity);

  // PnL percentage = PnL / margin * 100
  const unrealizedPnlPercent = margin.isZero()
    ? new BigNumber(0)
    : unrealizedPnl.dividedBy(margin).multipliedBy(100);

  // Liquidation price
  const liquidationPrice = calculateLiquidationPrice(position);

  // Margin ratio = margin / notional
  const marginRatio = notionalValue.isZero()
    ? new BigNumber(0)
    : margin.dividedBy(notionalValue);

  // Available margin = margin - maintenance margin + unrealized PnL
  const maintenanceMargin = notionalValue.multipliedBy(MAINTENANCE_MARGIN_RATIO);
  const availableMargin = margin.minus(maintenanceMargin).plus(unrealizedPnl);

  return {
    notionalValue: notionalValue.toFixed(),
    effectiveLeverage: effectiveLeverage.toFixed(2),
    unrealizedPnl: unrealizedPnl.toFixed(),
    unrealizedPnlPercent: unrealizedPnlPercent.toFixed(2),
    liquidationPrice: liquidationPrice.toFixed(),
    marginRatio: marginRatio.multipliedBy(100).toFixed(2),
    availableMargin: availableMargin.toFixed(),
  };
}

/**
 * Calculate required margin for a new position
 */
export function calculateRequiredMargin(
  price: string,
  quantity: string,
  leverage: number
): string {
  if (leverage < 1 || leverage > MAX_LEVERAGE) {
    throw new Error(`Leverage must be between 1 and ${MAX_LEVERAGE}`);
  }

  const priceBn = new BigNumber(price);
  const quantityBn = new BigNumber(quantity).abs();
  const notional = priceBn.multipliedBy(quantityBn);

  return notional.dividedBy(leverage).toFixed();
}

/**
 * Calculate maximum position size based on available margin
 */
export function calculateMaxPositionSize(
  availableMargin: string,
  price: string,
  leverage: number
): string {
  const marginBn = new BigNumber(availableMargin);
  const priceBn = new BigNumber(price);

  if (priceBn.isZero()) {
    return '0';
  }

  const maxNotional = marginBn.multipliedBy(leverage);
  return maxNotional.dividedBy(priceBn).toFixed();
}

/**
 * Calculate funding payment
 */
export function calculateFundingPayment(
  position: Position,
  currentFundingRate: string
): string {
  const quantity = new BigNumber(position.quantity);
  const cumulativeFundingEntry = new BigNumber(position.cumulativeFundingEntry);
  const currentCumulativeFunding = new BigNumber(currentFundingRate);

  // Funding payment = position_quantity * (current_cumulative - entry_cumulative)
  const fundingDiff = currentCumulativeFunding.minus(cumulativeFundingEntry);
  return fundingDiff.multipliedBy(quantity).toFixed();
}

/**
 * Check if position is at risk of liquidation
 */
export function isAtLiquidationRisk(
  position: Position,
  currentPrice: string,
  warningThreshold: number = 0.1 // 10% margin remaining
): boolean {
  const metrics = calculatePositionMetrics(position, currentPrice);
  const marginRatio = new BigNumber(metrics.marginRatio).dividedBy(100);
  return marginRatio.lte(MAINTENANCE_MARGIN_RATIO + warningThreshold);
}

/**
 * Calculate position ROE (Return on Equity)
 */
export function calculateROE(
  position: Position,
  currentPrice: string
): string {
  const metrics = calculatePositionMetrics(position, currentPrice);
  return metrics.unrealizedPnlPercent;
}

/**
 * Format position for display
 */
export function formatPositionDisplay(
  position: Position,
  currentPrice: string
): Record<string, string> {
  const metrics = calculatePositionMetrics(position, currentPrice);
  const isLong = position.direction === POSITION_DIRECTIONS.LONG;

  return {
    marketId: position.marketId,
    direction: isLong ? 'LONG' : 'SHORT',
    quantity: position.quantity,
    entryPrice: position.entryPrice,
    markPrice: currentPrice,
    margin: position.margin,
    leverage: `${metrics.effectiveLeverage}x`,
    notionalValue: metrics.notionalValue,
    unrealizedPnl: metrics.unrealizedPnl,
    pnlPercent: `${metrics.unrealizedPnlPercent}%`,
    liquidationPrice: metrics.liquidationPrice,
    marginRatio: `${metrics.marginRatio}%`,
  };
}

/**
 * Calculate break-even price including fees
 */
export function calculateBreakEvenPrice(
  entryPrice: string,
  quantity: string,
  direction: string,
  entryFee: string,
  exitFeeRate: number
): string {
  const entry = new BigNumber(entryPrice);
  const qty = new BigNumber(quantity).abs();
  const fee = new BigNumber(entryFee);
  const isLong = direction === POSITION_DIRECTIONS.LONG;

  // Total cost per unit = entry price + entry fee / quantity
  const feePerUnit = fee.dividedBy(qty);

  if (isLong) {
    // Need price to cover entry fee + exit fee
    // breakeven = entry + feePerUnit + breakeven * exitFeeRate / qty
    // breakeven * (1 - exitFeeRate) = entry + feePerUnit
    return entry.plus(feePerUnit).dividedBy(1 - exitFeeRate).toFixed();
  } else {
    // Short: need price to drop enough to cover fees
    return entry.minus(feePerUnit).dividedBy(1 + exitFeeRate).toFixed();
  }
}

/**
 * Merge two positions (average down/up)
 */
export function mergePositions(
  existingPosition: Position,
  newPrice: string,
  newQuantity: string,
  newMargin: string
): { averagePrice: string; totalQuantity: string; totalMargin: string } {
  const existingQty = new BigNumber(existingPosition.quantity);
  const existingPrice = new BigNumber(existingPosition.entryPrice);
  const existingMargin = new BigNumber(existingPosition.margin);

  const addQty = new BigNumber(newQuantity);
  const addPrice = new BigNumber(newPrice);
  const addMargin = new BigNumber(newMargin);

  const totalQuantity = existingQty.plus(addQty);
  const totalMargin = existingMargin.plus(addMargin);

  // Weighted average price
  const weightedSum = existingPrice
    .multipliedBy(existingQty)
    .plus(addPrice.multipliedBy(addQty));
  const averagePrice = totalQuantity.isZero()
    ? new BigNumber(0)
    : weightedSum.dividedBy(totalQuantity);

  return {
    averagePrice: averagePrice.toFixed(),
    totalQuantity: totalQuantity.toFixed(),
    totalMargin: totalMargin.toFixed(),
  };
}
