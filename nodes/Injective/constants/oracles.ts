/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Injective Oracle Constants
 *
 * Oracle configurations for price feeds on Injective.
 * Supports Band Protocol, Pyth Network, and Chainlink oracles.
 */

export interface OracleInfo {
  symbol: string;
  oracleType: 'band' | 'pyth' | 'chainlink' | 'provider';
  base: string;
  quote: string;
  oracleScaleFactor: number;
}

/**
 * Oracle types supported by Injective
 */
export const ORACLE_TYPES = {
  BAND: 'band',
  PYTH: 'pyth',
  CHAINLINK: 'chainlink',
  PROVIDER: 'provider',
} as const;

/**
 * Common Band Protocol oracle symbols
 */
export const BAND_ORACLES: Record<string, OracleInfo> = {
  'BTC/USD': {
    symbol: 'BTC',
    oracleType: 'band',
    base: 'BTC',
    quote: 'USD',
    oracleScaleFactor: 6,
  },
  'ETH/USD': {
    symbol: 'ETH',
    oracleType: 'band',
    base: 'ETH',
    quote: 'USD',
    oracleScaleFactor: 6,
  },
  'INJ/USD': {
    symbol: 'INJ',
    oracleType: 'band',
    base: 'INJ',
    quote: 'USD',
    oracleScaleFactor: 6,
  },
  'ATOM/USD': {
    symbol: 'ATOM',
    oracleType: 'band',
    base: 'ATOM',
    quote: 'USD',
    oracleScaleFactor: 6,
  },
  'OSMO/USD': {
    symbol: 'OSMO',
    oracleType: 'band',
    base: 'OSMO',
    quote: 'USD',
    oracleScaleFactor: 6,
  },
};

/**
 * Pyth Network price feed IDs
 * These are the official Pyth price feed identifiers
 */
export const PYTH_PRICE_FEEDS: Record<string, string> = {
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'INJ/USD': '0x7a5bc1d2b56ad029048cd63964b3ad2776eadf812eef1c0df1a0ba3a22e0b30a',
  'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'ATOM/USD': '0xb00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819',
  'USDT/USD': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'USDC/USD': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
};

/**
 * Oracle base URLs
 */
export const ORACLE_ENDPOINTS = {
  BAND_MAINNET: 'https://laozi1.bandchain.org',
  BAND_TESTNET: 'https://laozi-testnet6.bandchain.org',
  PYTH_MAINNET: 'https://hermes.pyth.network',
  PYTH_TESTNET: 'https://hermes-beta.pyth.network',
} as const;

/**
 * Price staleness thresholds (in seconds)
 */
export const PRICE_STALENESS = {
  CRITICAL: 60, // 1 minute - prices are stale
  WARNING: 30, // 30 seconds - prices may be slightly delayed
  FRESH: 10, // 10 seconds - prices are fresh
} as const;

/**
 * Oracle scale factors for different quote currencies
 */
export const ORACLE_SCALE_FACTORS = {
  USD: 6,
  USDT: 6,
  USDC: 6,
  BTC: 8,
  ETH: 18,
} as const;
