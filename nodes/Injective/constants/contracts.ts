/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Injective Contract Addresses and IBC Channels
 *
 * Important addresses and channel IDs for cross-chain operations.
 */

/**
 * Peggy Bridge contract addresses on Ethereum
 */
export const PEGGY_CONTRACTS = {
  mainnet: {
    peggyContract: '0xF955C57f9EA9Dc8781965FEaE0b6A2acE2BAD6f3',
    injTokenContract: '0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30',
    cosmosStaking: '0x1234567890123456789012345678901234567890', // Placeholder
  },
  testnet: {
    peggyContract: '0x1234567890123456789012345678901234567890', // Placeholder
    injTokenContract: '0x1234567890123456789012345678901234567890', // Placeholder
    cosmosStaking: '0x1234567890123456789012345678901234567890', // Placeholder
  },
} as const;

/**
 * IBC Channel IDs for common chains
 * Channel IDs are used for IBC transfers between chains
 */
export const IBC_CHANNELS = {
  mainnet: {
    cosmosHub: {
      sourceChannel: 'channel-1',
      destinationChannel: 'channel-220',
    },
    osmosis: {
      sourceChannel: 'channel-8',
      destinationChannel: 'channel-122',
    },
    stride: {
      sourceChannel: 'channel-89',
      destinationChannel: 'channel-6',
    },
    axelar: {
      sourceChannel: 'channel-84',
      destinationChannel: 'channel-10',
    },
    noble: {
      sourceChannel: 'channel-148',
      destinationChannel: 'channel-31',
    },
    ethereum: {
      sourceChannel: 'channel-83', // via Axelar
      destinationChannel: 'channel-4',
    },
    persistence: {
      sourceChannel: 'channel-82',
      destinationChannel: 'channel-41',
    },
    evmos: {
      sourceChannel: 'channel-90',
      destinationChannel: 'channel-10',
    },
  },
  testnet: {
    cosmosHub: {
      sourceChannel: 'channel-1',
      destinationChannel: 'channel-0',
    },
    osmosis: {
      sourceChannel: 'channel-0',
      destinationChannel: 'channel-0',
    },
  },
} as const;

/**
 * Common CosmWasm contract code IDs
 * Note: These may change with contract updates
 */
export const WASM_CODE_IDS = {
  mainnet: {
    cw20Base: 1,
    cw721Base: 2,
    wasmSwapRouter: 10,
    astroport: 15,
  },
  testnet: {
    cw20Base: 1,
    cw721Base: 2,
    wasmSwapRouter: 10,
    astroport: 15,
  },
} as const;

/**
 * Important protocol addresses
 */
export const PROTOCOL_ADDRESSES = {
  mainnet: {
    auctionModule: 'inj1...',
    insuranceFundModule: 'inj1...',
    exchangeModule: 'inj1...',
    peggyModule: 'inj1...',
    stakingModule: 'inj1...',
  },
  testnet: {
    auctionModule: 'inj1...',
    insuranceFundModule: 'inj1...',
    exchangeModule: 'inj1...',
    peggyModule: 'inj1...',
    stakingModule: 'inj1...',
  },
} as const;

/**
 * Validator addresses for staking
 */
export const VALIDATORS = {
  mainnet: [
    {
      name: 'Injective Labs',
      operatorAddress: 'injvaloper1ultw9r29l8nxy5u6thcgusjn95vsy2caw722q5',
      website: 'https://injective.com',
    },
    // Add more validators as needed
  ],
  testnet: [
    {
      name: 'Injective Labs Testnet',
      operatorAddress: 'injvaloper1...',
      website: 'https://injective.com',
    },
  ],
} as const;

/**
 * Module accounts
 */
export const MODULE_ACCOUNTS = {
  exchange: 'inj1qg5ega6dykkxc307y25pecuufrjkxkaggkkxh7nad0vhyhtuhw3sqp2p68',
  auction: 'inj1dy5a5n3q9v2xrkj4xfvzuvp5vf9wnfnz4gycxs',
  insurance: 'inj1q8y8gxaym4x2xkxq0eqv9qzrlxlw8w46rz9w4e',
  peggy: 'inj1plf5cvxpuvs4fxhsjqy5arzrt5qszlc8j5zdxv',
  feeCollector: 'inj17xpfvakm2amg962yls6f84z3kell8c5lnqnqfl',
} as const;

/**
 * IBC timeout defaults
 */
export const IBC_TIMEOUTS = {
  DEFAULT_TIMEOUT_HEIGHT: 100, // blocks
  DEFAULT_TIMEOUT_TIMESTAMP: 600, // seconds (10 minutes)
} as const;
