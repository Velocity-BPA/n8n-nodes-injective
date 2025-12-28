/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';

/**
 * Market Utilities for Injective Exchange
 *
 * Helpers for market data processing, price calculations,
 * and orderbook analysis.
 */

export interface OrderbookEntry {
  price: string;
  quantity: string;
  timestamp?: number;
}

export interface Orderbook {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  timestamp: number;
}

export interface MarketStats {
  high24h: string;
  low24h: string;
  volume24h: string;
  priceChange24h: string;
  priceChangePercent24h: string;
  lastPrice: string;
  markPrice: string;
  indexPrice: string;
}

/**
 * Calculate mid price from orderbook
 */
export function calculateMidPrice(orderbook: Orderbook): string {
  if (orderbook.bids.length === 0 || orderbook.asks.length === 0) {
    return '0';
  }

  const bestBid = new BigNumber(orderbook.bids[0].price);
  const bestAsk = new BigNumber(orderbook.asks[0].price);

  return bestBid.plus(bestAsk).dividedBy(2).toFixed();
}

/**
 * Calculate spread
 */
export function calculateSpread(orderbook: Orderbook): {
  absolute: string;
  percentage: string;
} {
  if (orderbook.bids.length === 0 || orderbook.asks.length === 0) {
    return { absolute: '0', percentage: '0' };
  }

  const bestBid = new BigNumber(orderbook.bids[0].price);
  const bestAsk = new BigNumber(orderbook.asks[0].price);
  const midPrice = bestBid.plus(bestAsk).dividedBy(2);

  const absoluteSpread = bestAsk.minus(bestBid);
  const percentageSpread = midPrice.isZero()
    ? new BigNumber(0)
    : absoluteSpread.dividedBy(midPrice).multipliedBy(100);

  return {
    absolute: absoluteSpread.toFixed(),
    percentage: percentageSpread.toFixed(4),
  };
}

/**
 * Calculate market depth (liquidity) at a price level
 */
export function calculateDepthAtPrice(
  orderbook: Orderbook,
  targetPrice: string,
  side: 'bid' | 'ask'
): string {
  const target = new BigNumber(targetPrice);
  const entries = side === 'bid' ? orderbook.bids : orderbook.asks;
  
  let totalQuantity = new BigNumber(0);

  for (const entry of entries) {
    const price = new BigNumber(entry.price);
    
    if (side === 'bid') {
      // Sum all bids at or above target price
      if (price.gte(target)) {
        totalQuantity = totalQuantity.plus(entry.quantity);
      }
    } else {
      // Sum all asks at or below target price
      if (price.lte(target)) {
        totalQuantity = totalQuantity.plus(entry.quantity);
      }
    }
  }

  return totalQuantity.toFixed();
}

/**
 * Calculate total orderbook depth
 */
export function calculateTotalDepth(orderbook: Orderbook): {
  bidDepth: string;
  askDepth: string;
  totalDepth: string;
} {
  const bidDepth = orderbook.bids.reduce(
    (sum, entry) => sum.plus(new BigNumber(entry.quantity).multipliedBy(entry.price)),
    new BigNumber(0)
  );

  const askDepth = orderbook.asks.reduce(
    (sum, entry) => sum.plus(new BigNumber(entry.quantity).multipliedBy(entry.price)),
    new BigNumber(0)
  );

  return {
    bidDepth: bidDepth.toFixed(),
    askDepth: askDepth.toFixed(),
    totalDepth: bidDepth.plus(askDepth).toFixed(),
  };
}

/**
 * Estimate execution price for a market order
 * Walks through the orderbook to calculate average fill price
 */
export function estimateExecutionPrice(
  orderbook: Orderbook,
  quantity: string,
  side: 'buy' | 'sell'
): { averagePrice: string; totalCost: string; slippage: string } | null {
  const targetQty = new BigNumber(quantity);
  const entries = side === 'buy' ? orderbook.asks : orderbook.bids;

  if (entries.length === 0) {
    return null;
  }

  let filledQty = new BigNumber(0);
  let totalCost = new BigNumber(0);
  const bestPrice = new BigNumber(entries[0].price);

  for (const entry of entries) {
    const availableQty = new BigNumber(entry.quantity);
    const price = new BigNumber(entry.price);
    const remainingQty = targetQty.minus(filledQty);

    if (remainingQty.lte(0)) break;

    const fillQty = BigNumber.min(availableQty, remainingQty);
    totalCost = totalCost.plus(fillQty.multipliedBy(price));
    filledQty = filledQty.plus(fillQty);
  }

  if (filledQty.lt(targetQty)) {
    // Not enough liquidity
    return null;
  }

  const averagePrice = totalCost.dividedBy(filledQty);
  const slippage = averagePrice.minus(bestPrice).dividedBy(bestPrice).multipliedBy(100).abs();

  return {
    averagePrice: averagePrice.toFixed(),
    totalCost: totalCost.toFixed(),
    slippage: slippage.toFixed(4),
  };
}

/**
 * Check if a limit order would be immediately fillable
 */
export function isImmediatelyFillable(
  orderbook: Orderbook,
  price: string,
  side: 'buy' | 'sell'
): boolean {
  const orderPrice = new BigNumber(price);

  if (side === 'buy') {
    // Buy order: fillable if price >= best ask
    if (orderbook.asks.length === 0) return false;
    const bestAsk = new BigNumber(orderbook.asks[0].price);
    return orderPrice.gte(bestAsk);
  } else {
    // Sell order: fillable if price <= best bid
    if (orderbook.bids.length === 0) return false;
    const bestBid = new BigNumber(orderbook.bids[0].price);
    return orderPrice.lte(bestBid);
  }
}

/**
 * Calculate VWAP (Volume Weighted Average Price) from trades
 */
export function calculateVWAP(
  trades: Array<{ price: string; quantity: string }>
): string {
  if (trades.length === 0) return '0';

  let sumPriceQty = new BigNumber(0);
  let sumQty = new BigNumber(0);

  for (const trade of trades) {
    const price = new BigNumber(trade.price);
    const quantity = new BigNumber(trade.quantity);
    sumPriceQty = sumPriceQty.plus(price.multipliedBy(quantity));
    sumQty = sumQty.plus(quantity);
  }

  return sumQty.isZero() ? '0' : sumPriceQty.dividedBy(sumQty).toFixed();
}

/**
 * Calculate price impact for a trade
 */
export function calculatePriceImpact(
  entryPrice: string,
  exitPrice: string
): string {
  const entry = new BigNumber(entryPrice);
  const exit = new BigNumber(exitPrice);

  if (entry.isZero()) return '0';

  return exit.minus(entry).dividedBy(entry).multipliedBy(100).toFixed(4);
}

/**
 * Round price to market tick size
 */
export function roundToTickSize(
  price: string,
  tickSize: string,
  direction: 'up' | 'down' | 'nearest' = 'nearest'
): string {
  const priceBn = new BigNumber(price);
  const tickBn = new BigNumber(tickSize);

  if (tickBn.isZero()) return price;

  const quotient = priceBn.dividedBy(tickBn);

  switch (direction) {
    case 'up':
      return quotient.integerValue(BigNumber.ROUND_CEIL).multipliedBy(tickBn).toFixed();
    case 'down':
      return quotient.integerValue(BigNumber.ROUND_FLOOR).multipliedBy(tickBn).toFixed();
    default:
      return quotient.integerValue(BigNumber.ROUND_HALF_UP).multipliedBy(tickBn).toFixed();
  }
}

/**
 * Round quantity to market step size
 */
export function roundToStepSize(
  quantity: string,
  stepSize: string,
  direction: 'up' | 'down' = 'down'
): string {
  const quantityBn = new BigNumber(quantity);
  const stepBn = new BigNumber(stepSize);

  if (stepBn.isZero()) return quantity;

  const quotient = quantityBn.dividedBy(stepBn);
  const roundMode = direction === 'up' ? BigNumber.ROUND_CEIL : BigNumber.ROUND_FLOOR;

  return quotient.integerValue(roundMode).multipliedBy(stepBn).toFixed();
}

/**
 * Format market ticker for display
 */
export function formatTicker(ticker: string): {
  base: string;
  quote: string;
  display: string;
} {
  const parts = ticker.split('/');
  if (parts.length === 2) {
    return {
      base: parts[0],
      quote: parts[1],
      display: ticker,
    };
  }

  // Handle PERP format
  if (ticker.includes('PERP')) {
    const base = ticker.replace(' PERP', '').replace('/USDT', '');
    return {
      base,
      quote: 'USDT',
      display: ticker,
    };
  }

  return {
    base: ticker,
    quote: 'UNKNOWN',
    display: ticker,
  };
}

/**
 * Calculate price percentage change
 */
export function calculatePriceChange(
  oldPrice: string,
  newPrice: string
): { absolute: string; percentage: string } {
  const old = new BigNumber(oldPrice);
  const current = new BigNumber(newPrice);

  const absolute = current.minus(old);
  const percentage = old.isZero()
    ? new BigNumber(0)
    : absolute.dividedBy(old).multipliedBy(100);

  return {
    absolute: absolute.toFixed(),
    percentage: percentage.toFixed(2),
  };
}
