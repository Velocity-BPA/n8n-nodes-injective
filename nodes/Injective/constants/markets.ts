/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Injective Market Constants
 *
 * Common market IDs and configurations for trading on Injective.
 * Market IDs are hashes that identify specific trading pairs.
 */

export interface MarketInfo {
  marketId: string;
  ticker: string;
  baseDenom: string;
  quoteDenom: string;
  marketType: 'spot' | 'derivative';
  minPriceTickSize: string;
  minQuantityTickSize: string;
}

/**
 * Popular spot market IDs on Injective Mainnet
 * These may change - always verify current market IDs via API
 */
export const SPOT_MARKETS: Record<string, MarketInfo> = {
  'INJ/USDT': {
    marketId: '0xa508cb32923323679f29a032c70342c147c17d0145625571b34f1ae03c52e3f5',
    ticker: 'INJ/USDT',
    baseDenom: 'inj',
    quoteDenom: 'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7',
    marketType: 'spot',
    minPriceTickSize: '0.001',
    minQuantityTickSize: '0.001',
  },
  'ATOM/USDT': {
    marketId: '0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe',
    ticker: 'ATOM/USDT',
    baseDenom: 'ibc/C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9',
    quoteDenom: 'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7',
    marketType: 'spot',
    minPriceTickSize: '0.001',
    minQuantityTickSize: '0.01',
  },
  'WETH/USDT': {
    marketId: '0xd1956e20d74eeb1febe8cd6c8699e0c5c7c6c83e0802c34e6c9c2c8d90bc4e1a',
    ticker: 'WETH/USDT',
    baseDenom: 'peggy0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    quoteDenom: 'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7',
    marketType: 'spot',
    minPriceTickSize: '0.01',
    minQuantityTickSize: '0.0001',
  },
};

/**
 * Popular derivative (perpetual) market IDs on Injective Mainnet
 */
export const DERIVATIVE_MARKETS: Record<string, MarketInfo> = {
  'BTC/USDT PERP': {
    marketId: '0x4ca0f92fc28be0c9761f1ac5c1a6e8634e8fb7d6e2e',
    ticker: 'BTC/USDT PERP',
    baseDenom: 'BTC',
    quoteDenom: 'USDT',
    marketType: 'derivative',
    minPriceTickSize: '0.1',
    minQuantityTickSize: '0.001',
  },
  'ETH/USDT PERP': {
    marketId: '0xd97d0da6f6c11710ef06315971250e4e9aed4b7d4cd02f17e6d4abb40cc2a7c0',
    ticker: 'ETH/USDT PERP',
    baseDenom: 'ETH',
    quoteDenom: 'USDT',
    marketType: 'derivative',
    minPriceTickSize: '0.01',
    minQuantityTickSize: '0.01',
  },
  'INJ/USDT PERP': {
    marketId: '0x9b9980167ecc3645ff1a5517886652d94a0825e54a77d2057c2f1c12b43c18d5',
    ticker: 'INJ/USDT PERP',
    baseDenom: 'INJ',
    quoteDenom: 'USDT',
    marketType: 'derivative',
    minPriceTickSize: '0.001',
    minQuantityTickSize: '0.1',
  },
};

/**
 * Order types supported by Injective Exchange
 */
export const ORDER_TYPES = {
  LIMIT: 1,
  MARKET: 2,
  STOP_LIMIT: 3,
  STOP_MARKET: 4,
  TAKE_PROFIT_LIMIT: 5,
  TAKE_PROFIT_MARKET: 6,
  LIMIT_MAKER: 7, // Post-only
} as const;

/**
 * Order side constants
 */
export const ORDER_SIDES = {
  BUY: 1,
  SELL: 2,
} as const;

/**
 * Order execution types
 */
export const EXECUTION_TYPES = {
  LIMIT: 'limit',
  MARKET: 'market',
} as const;

/**
 * Order state constants
 */
export const ORDER_STATES = {
  BOOKED: 'booked',
  PARTIAL_FILLED: 'partial_filled',
  FILLED: 'filled',
  CANCELED: 'canceled',
} as const;

/**
 * Position direction constants
 */
export const POSITION_DIRECTIONS = {
  LONG: 'long',
  SHORT: 'short',
} as const;

/**
 * Default leverage for derivatives
 */
export const DEFAULT_LEVERAGE = 1;

/**
 * Maximum leverage (varies by market)
 */
export const MAX_LEVERAGE = 20;
