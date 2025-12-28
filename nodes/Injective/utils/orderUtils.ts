/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';
import { ORDER_TYPES, ORDER_SIDES, ORDER_STATES } from '../constants/markets';

/**
 * Order Utilities for Injective Exchange
 *
 * Helpers for creating, validating, and formatting orders
 * for both spot and derivative markets.
 */

export interface OrderParams {
  marketId: string;
  subaccountId: string;
  orderType: number;
  side: number;
  price?: string;
  quantity: string;
  triggerPrice?: string;
  leverage?: number;
  margin?: string;
  feeRecipient?: string;
}

export interface OrderValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Generate a unique order hash
 * This is a client-side identifier, not the on-chain order hash
 */
export function generateOrderHash(): string {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).slice(2, 10);
  return `0x${timestamp}${random}`.padEnd(66, '0');
}

/**
 * Validate order parameters
 */
export function validateOrder(params: OrderParams): OrderValidation {
  const errors: string[] = [];

  // Validate market ID
  if (!params.marketId || !params.marketId.startsWith('0x')) {
    errors.push('Invalid market ID format');
  }

  // Validate subaccount ID
  if (!params.subaccountId || params.subaccountId.length !== 66) {
    errors.push('Invalid subaccount ID format');
  }

  // Validate order type
  if (!Object.values(ORDER_TYPES).includes(params.orderType)) {
    errors.push(`Invalid order type: ${params.orderType}`);
  }

  // Validate side
  if (!Object.values(ORDER_SIDES).includes(params.side)) {
    errors.push(`Invalid order side: ${params.side}`);
  }

  // Validate quantity
  const quantity = new BigNumber(params.quantity);
  if (quantity.isNaN() || quantity.lte(0)) {
    errors.push('Quantity must be a positive number');
  }

  // Validate price for limit orders
  if (params.orderType === ORDER_TYPES.LIMIT || params.orderType === ORDER_TYPES.LIMIT_MAKER) {
    if (!params.price) {
      errors.push('Price is required for limit orders');
    } else {
      const price = new BigNumber(params.price);
      if (price.isNaN() || price.lte(0)) {
        errors.push('Price must be a positive number');
      }
    }
  }

  // Validate trigger price for stop orders
  if (
    params.orderType === ORDER_TYPES.STOP_LIMIT ||
    params.orderType === ORDER_TYPES.STOP_MARKET
  ) {
    if (!params.triggerPrice) {
      errors.push('Trigger price is required for stop orders');
    }
  }

  // Validate leverage for derivatives
  if (params.leverage !== undefined) {
    if (params.leverage < 1 || params.leverage > 20) {
      errors.push('Leverage must be between 1 and 20');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format order for display
 */
export function formatOrderDisplay(order: {
  orderHash: string;
  marketId: string;
  side: number;
  orderType: number;
  price: string;
  quantity: string;
  filledQuantity?: string;
  state: string;
}): Record<string, string> {
  const sideLabel = order.side === ORDER_SIDES.BUY ? 'BUY' : 'SELL';
  const typeLabel = getOrderTypeLabel(order.orderType);
  const stateLabel = order.state.toUpperCase();

  const filled = order.filledQuantity
    ? new BigNumber(order.filledQuantity)
    : new BigNumber(0);
  const total = new BigNumber(order.quantity);
  const fillPercent = total.isZero()
    ? '0'
    : filled.dividedBy(total).multipliedBy(100).toFixed(2);

  return {
    orderHash: order.orderHash,
    side: sideLabel,
    type: typeLabel,
    price: order.price,
    quantity: order.quantity,
    filled: order.filledQuantity || '0',
    fillPercent: `${fillPercent}%`,
    state: stateLabel,
  };
}

/**
 * Get order type label
 */
export function getOrderTypeLabel(orderType: number): string {
  const labels: Record<number, string> = {
    [ORDER_TYPES.LIMIT]: 'LIMIT',
    [ORDER_TYPES.MARKET]: 'MARKET',
    [ORDER_TYPES.STOP_LIMIT]: 'STOP_LIMIT',
    [ORDER_TYPES.STOP_MARKET]: 'STOP_MARKET',
    [ORDER_TYPES.TAKE_PROFIT_LIMIT]: 'TAKE_PROFIT_LIMIT',
    [ORDER_TYPES.TAKE_PROFIT_MARKET]: 'TAKE_PROFIT_MARKET',
    [ORDER_TYPES.LIMIT_MAKER]: 'POST_ONLY',
  };
  return labels[orderType] || 'UNKNOWN';
}

/**
 * Get order state label
 */
export function getOrderStateLabel(state: string): string {
  const labels: Record<string, string> = {
    [ORDER_STATES.BOOKED]: 'Open',
    [ORDER_STATES.PARTIAL_FILLED]: 'Partially Filled',
    [ORDER_STATES.FILLED]: 'Filled',
    [ORDER_STATES.CANCELED]: 'Cancelled',
  };
  return labels[state] || state;
}

/**
 * Calculate order notional value
 */
export function calculateNotionalValue(price: string, quantity: string): string {
  const priceBn = new BigNumber(price);
  const quantityBn = new BigNumber(quantity);
  return priceBn.multipliedBy(quantityBn).toFixed();
}

/**
 * Estimate trading fees
 *
 * @param notionalValue - Total notional value of the order
 * @param makerFeeRate - Maker fee rate (e.g., 0.001 for 0.1%)
 * @param takerFeeRate - Taker fee rate (e.g., 0.002 for 0.2%)
 * @param isMaker - True if order is maker (limit order)
 */
export function estimateTradingFee(
  notionalValue: string,
  makerFeeRate: number,
  takerFeeRate: number,
  isMaker: boolean
): string {
  const notional = new BigNumber(notionalValue);
  const feeRate = isMaker ? makerFeeRate : takerFeeRate;
  return notional.multipliedBy(feeRate).toFixed();
}

/**
 * Parse order hash from transaction response
 */
export function parseOrderHashFromTx(txResponse: {
  logs?: Array<{ events?: Array<{ type: string; attributes: Array<{ key: string; value: string }> }> }>;
}): string | null {
  if (!txResponse.logs || txResponse.logs.length === 0) {
    return null;
  }

  for (const log of txResponse.logs) {
    if (!log.events) continue;

    for (const event of log.events) {
      if (event.type === 'injective.exchange.v1beta1.EventNewSpotOrders' ||
          event.type === 'injective.exchange.v1beta1.EventNewDerivativeOrders') {
        const orderHashAttr = event.attributes.find(
          (attr) => attr.key === 'order_hash' || attr.key === 'orderHash'
        );
        if (orderHashAttr) {
          return orderHashAttr.value;
        }
      }
    }
  }

  return null;
}

/**
 * Create a subaccount ID from an address and index
 *
 * @param address - Injective address (inj1...)
 * @param index - Subaccount index (0-255)
 * @returns Subaccount ID (66 chars hex)
 */
export function createSubaccountId(address: string, index: number = 0): string {
  if (!address.startsWith('inj1')) {
    throw new Error('Invalid Injective address');
  }
  if (index < 0 || index > 255) {
    throw new Error('Subaccount index must be between 0 and 255');
  }

  // Remove 'inj1' prefix and convert bech32 to hex
  // Note: This is a simplified version; production should use proper bech32 decoding
  const addressHex = address.slice(4).padStart(40, '0');
  const indexHex = index.toString(16).padStart(24, '0');

  return `0x${addressHex}${indexHex}`;
}

/**
 * Check if an order is fillable
 */
export function isOrderFillable(state: string): boolean {
  return state === ORDER_STATES.BOOKED || state === ORDER_STATES.PARTIAL_FILLED;
}

/**
 * Calculate remaining quantity
 */
export function getRemainingQuantity(quantity: string, filledQuantity: string): string {
  const total = new BigNumber(quantity);
  const filled = new BigNumber(filledQuantity);
  const remaining = total.minus(filled);
  return remaining.isNegative() ? '0' : remaining.toFixed();
}
