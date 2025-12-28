/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Injective Denom Constants
 *
 * Denomination mappings for tokens on Injective.
 * Includes native tokens, Peggy bridge tokens, and IBC tokens.
 */

export interface DenomInfo {
  denom: string;
  symbol: string;
  name: string;
  decimals: number;
  coingeckoId?: string;
  logo?: string;
}

/**
 * Native Injective token
 */
export const INJ_DENOM: DenomInfo = {
  denom: 'inj',
  symbol: 'INJ',
  name: 'Injective',
  decimals: 18,
  coingeckoId: 'injective-protocol',
};

/**
 * Common Peggy (Ethereum bridge) tokens
 * Format: peggy{ethereum_contract_address}
 */
export const PEGGY_DENOMS: Record<string, DenomInfo> = {
  USDT: {
    denom: 'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    coingeckoId: 'tether',
  },
  USDC: {
    denom: 'peggy0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    coingeckoId: 'usd-coin',
  },
  WETH: {
    denom: 'peggy0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    coingeckoId: 'weth',
  },
  WBTC: {
    denom: 'peggy0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    coingeckoId: 'wrapped-bitcoin',
  },
  DAI: {
    denom: 'peggy0x6B175474E89094C44Da98b954EescdeCB5BE3830',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    coingeckoId: 'dai',
  },
  LINK: {
    denom: 'peggy0x514910771AF9Ca656af840dff83E8264EcF986CA',
    symbol: 'LINK',
    name: 'Chainlink',
    decimals: 18,
    coingeckoId: 'chainlink',
  },
};

/**
 * Common IBC tokens
 * Format: ibc/{hash}
 */
export const IBC_DENOMS: Record<string, DenomInfo> = {
  ATOM: {
    denom: 'ibc/C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9',
    symbol: 'ATOM',
    name: 'Cosmos Hub',
    decimals: 6,
    coingeckoId: 'cosmos',
  },
  OSMO: {
    denom: 'ibc/92E0120F15D037353CFB73C14651FC8930ADC05B93100FD7754D3A689E53B333',
    symbol: 'OSMO',
    name: 'Osmosis',
    decimals: 6,
    coingeckoId: 'osmosis',
  },
  USDC_NOBLE: {
    denom: 'ibc/2CBC2EA121AE42563B08028466F37B600F2D7D4282342DADB09A5E2D8C5A2B6A',
    symbol: 'USDC',
    name: 'Noble USDC',
    decimals: 6,
    coingeckoId: 'usd-coin',
  },
  STINJ: {
    denom: 'ibc/AC87717EA002B0123B10A05063E69BCA274BA2C44D842AEEB41558D2856C8C00',
    symbol: 'stINJ',
    name: 'Stride Staked INJ',
    decimals: 18,
    coingeckoId: 'stride-staked-injective',
  },
};

/**
 * All common denoms combined
 */
export const ALL_DENOMS: Record<string, DenomInfo> = {
  INJ: INJ_DENOM,
  ...PEGGY_DENOMS,
  ...IBC_DENOMS,
};

/**
 * Get denom info by symbol
 */
export function getDenomBySymbol(symbol: string): DenomInfo | undefined {
  const upperSymbol = symbol.toUpperCase();
  return ALL_DENOMS[upperSymbol];
}

/**
 * Get denom info by denom string
 */
export function getDenomInfo(denom: string): DenomInfo | undefined {
  return Object.values(ALL_DENOMS).find((info) => info.denom === denom);
}

/**
 * INJ decimal precision
 */
export const INJ_DECIMALS = 18;

/**
 * Convert from base units to display units
 */
export function fromBaseUnits(amount: string, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const value = BigInt(amount);
  const intPart = value / divisor;
  const fracPart = value % divisor;
  const fracStr = fracPart.toString().padStart(decimals, '0');
  return `${intPart}.${fracStr}`.replace(/\.?0+$/, '') || '0';
}

/**
 * Convert from display units to base units
 */
export function toBaseUnits(amount: string, decimals: number): string {
  const [intPart, fracPart = ''] = amount.split('.');
  const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(intPart + paddedFrac).toString();
}
