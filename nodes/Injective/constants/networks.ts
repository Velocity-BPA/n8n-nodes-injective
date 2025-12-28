/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Injective Network Configurations
 *
 * Contains endpoint URLs and chain IDs for all supported networks.
 * These are the official Injective endpoints as of the package release.
 */

export interface NetworkConfig {
  name: string;
  chainId: string;
  grpcEndpoint: string;
  restEndpoint: string;
  wsEndpoint: string;
  indexerGrpcEndpoint: string;
  indexerRestEndpoint: string;
  exchangeApiEndpoint: string;
  explorerApiEndpoint: string;
  chronosApiEndpoint: string;
  evmRpcUrl: string;
  evmChainId: number;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Injective Mainnet',
    chainId: 'injective-1',
    grpcEndpoint: 'https://sentry.chain.grpc.injective.network',
    restEndpoint: 'https://sentry.lcd.injective.network',
    wsEndpoint: 'wss://sentry.chain.stream.injective.network',
    indexerGrpcEndpoint: 'https://sentry.exchange.grpc.injective.network',
    indexerRestEndpoint: 'https://sentry.exchange.rest.injective.network',
    exchangeApiEndpoint: 'https://api.injective.exchange',
    explorerApiEndpoint: 'https://explorer-api.injective.network',
    chronosApiEndpoint: 'https://chronos-api.injective.network',
    evmRpcUrl: 'https://evm.injective.network',
    evmChainId: 1,
  },
  testnet: {
    name: 'Injective Testnet',
    chainId: 'injective-888',
    grpcEndpoint: 'https://testnet.sentry.chain.grpc.injective.network',
    restEndpoint: 'https://testnet.sentry.lcd.injective.network',
    wsEndpoint: 'wss://testnet.sentry.chain.stream.injective.network',
    indexerGrpcEndpoint: 'https://testnet.sentry.exchange.grpc.injective.network',
    indexerRestEndpoint: 'https://testnet.sentry.exchange.rest.injective.network',
    exchangeApiEndpoint: 'https://testnet.api.injective.exchange',
    explorerApiEndpoint: 'https://testnet.explorer-api.injective.network',
    chronosApiEndpoint: 'https://testnet.chronos-api.injective.network',
    evmRpcUrl: 'https://testnet.evm.injective.network',
    evmChainId: 888,
  },
  devnet: {
    name: 'Injective Devnet',
    chainId: 'injective-777',
    grpcEndpoint: 'https://devnet.grpc.injective.network',
    restEndpoint: 'https://devnet.lcd.injective.network',
    wsEndpoint: 'wss://devnet.stream.injective.network',
    indexerGrpcEndpoint: 'https://devnet.exchange.grpc.injective.network',
    indexerRestEndpoint: 'https://devnet.exchange.rest.injective.network',
    exchangeApiEndpoint: 'https://devnet.api.injective.exchange',
    explorerApiEndpoint: 'https://devnet.explorer-api.injective.network',
    chronosApiEndpoint: 'https://devnet.chronos-api.injective.network',
    evmRpcUrl: 'https://devnet.evm.injective.network',
    evmChainId: 777,
  },
};

/**
 * Get network configuration by network name
 */
export function getNetworkConfig(network: string): NetworkConfig {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}. Valid options: mainnet, testnet, devnet`);
  }
  return config;
}

/**
 * Chain ID constants for quick reference
 */
export const CHAIN_IDS = {
  MAINNET: 'injective-1',
  TESTNET: 'injective-888',
  DEVNET: 'injective-777',
} as const;

/**
 * Gas price defaults (in INJ)
 */
export const GAS_PRICES = {
  LOW: 500000000, // 0.5 gwei
  MEDIUM: 1000000000, // 1 gwei
  HIGH: 2000000000, // 2 gwei
} as const;

/**
 * Default gas limits for common operations
 */
export const GAS_LIMITS = {
  SEND: 100000,
  DELEGATE: 200000,
  UNDELEGATE: 200000,
  REDELEGATE: 300000,
  CLAIM_REWARDS: 200000,
  VOTE: 100000,
  PLACE_ORDER: 150000,
  CANCEL_ORDER: 100000,
  BATCH_ORDER: 300000,
  IBC_TRANSFER: 200000,
  WASM_EXECUTE: 500000,
  WASM_INSTANTIATE: 500000,
} as const;
