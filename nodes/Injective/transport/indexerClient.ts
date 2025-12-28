/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import axios, { AxiosInstance } from 'axios';
import { getNetworkConfig, NetworkConfig } from '../constants/networks';

/**
 * Injective Indexer Client
 *
 * Handles communication with Injective Explorer and Chronos APIs.
 * Provides access to transaction history, analytics, and historical data.
 */

export interface IndexerClientConfig {
  network: string;
  explorerApiEndpoint?: string;
  chronosApiEndpoint?: string;
  apiKey?: string;
}

export interface Transaction {
  txHash: string;
  blockNumber: number;
  blockTimestamp: string;
  code: number;
  data?: string;
  messages: Array<{
    type: string;
    value: Record<string, unknown>;
  }>;
  gasUsed: string;
  gasWanted: string;
  fee: {
    amount: Array<{ denom: string; amount: string }>;
    gas: string;
  };
}

export interface Block {
  height: number;
  timestamp: string;
  proposer: string;
  txCount: number;
}

export interface MarketCandle {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface MarketVolume {
  marketId: string;
  volume: string;
  volumeUsd: string;
}

export class IndexerClient {
  private config: NetworkConfig;
  private explorerClient: AxiosInstance;
  private chronosClient: AxiosInstance;

  constructor(clientConfig: IndexerClientConfig) {
    // Get network config or use custom endpoints
    if (clientConfig.network === 'custom') {
      this.config = {
        name: 'Custom Network',
        chainId: 'custom',
        grpcEndpoint: '',
        restEndpoint: '',
        wsEndpoint: '',
        indexerGrpcEndpoint: '',
        indexerRestEndpoint: '',
        exchangeApiEndpoint: '',
        explorerApiEndpoint: clientConfig.explorerApiEndpoint || '',
        chronosApiEndpoint: clientConfig.chronosApiEndpoint || '',
        evmRpcUrl: '',
        evmChainId: 1,
      };
    } else {
      this.config = getNetworkConfig(clientConfig.network);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (clientConfig.apiKey) {
      headers['X-API-Key'] = clientConfig.apiKey;
    }

    // Initialize HTTP clients
    this.explorerClient = axios.create({
      baseURL: this.config.explorerApiEndpoint,
      timeout: 30000,
      headers,
    });

    this.chronosClient = axios.create({
      baseURL: this.config.chronosApiEndpoint,
      timeout: 30000,
      headers,
    });
  }

  // ==================== Explorer API ====================

  /**
   * Get transactions by address
   */
  async getTransactionsByAddress(params: {
    address: string;
    skip?: number;
    limit?: number;
    type?: string;
  }): Promise<{
    transactions: Transaction[];
    total: number;
  }> {
    const response = await this.explorerClient.get<{
      data: Transaction[];
      paging: { total: number };
    }>('/api/explorer/v1/txs', { params });

    return {
      transactions: response.data.data,
      total: response.data.paging.total,
    };
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash: string): Promise<Transaction> {
    const response = await this.explorerClient.get<{
      data: Transaction;
    }>(`/api/explorer/v1/txs/${txHash}`);

    return response.data.data;
  }

  /**
   * Get recent blocks
   */
  async getBlocks(params: {
    skip?: number;
    limit?: number;
  }): Promise<{
    blocks: Block[];
    total: number;
  }> {
    const response = await this.explorerClient.get<{
      data: Array<{
        height: string;
        timestamp: string;
        proposer: string;
        numTxs: string;
      }>;
      paging: { total: number };
    }>('/api/explorer/v1/blocks', { params });

    return {
      blocks: response.data.data.map((b) => ({
        height: parseInt(b.height, 10),
        timestamp: b.timestamp,
        proposer: b.proposer,
        txCount: parseInt(b.numTxs, 10),
      })),
      total: response.data.paging.total,
    };
  }

  /**
   * Get block by height
   */
  async getBlock(height: number): Promise<Block> {
    const response = await this.explorerClient.get<{
      data: {
        height: string;
        timestamp: string;
        proposer: string;
        numTxs: string;
      };
    }>(`/api/explorer/v1/blocks/${height}`);

    const b = response.data.data;
    return {
      height: parseInt(b.height, 10),
      timestamp: b.timestamp,
      proposer: b.proposer,
      txCount: parseInt(b.numTxs, 10),
    };
  }

  /**
   * Get validators
   */
  async getValidators(): Promise<Array<{
    operatorAddress: string;
    moniker: string;
    commission: string;
    votingPower: string;
    uptime: string;
  }>> {
    const response = await this.explorerClient.get<{
      data: Array<{
        operatorAddress: string;
        moniker: string;
        commission: string;
        votingPower: string;
        uptime: string;
      }>;
    }>('/api/explorer/v1/validators');

    return response.data.data;
  }

  /**
   * Get account transactions
   */
  async getAccountTransactions(
    address: string,
    params?: {
      skip?: number;
      limit?: number;
    }
  ): Promise<Transaction[]> {
    const response = await this.explorerClient.get<{
      data: Transaction[];
    }>(`/api/explorer/v1/accountTxs/${address}`, { params });

    return response.data.data;
  }

  /**
   * Get CW20 token balances for address
   */
  async getCW20Balances(
    address: string
  ): Promise<Array<{
    contractAddress: string;
    balance: string;
    tokenInfo: {
      name: string;
      symbol: string;
      decimals: number;
    };
  }>> {
    const response = await this.explorerClient.get<{
      data: Array<{
        contractAddress: string;
        balance: string;
        tokenInfo: {
          name: string;
          symbol: string;
          decimals: number;
        };
      }>;
    }>(`/api/explorer/v1/cw20/balances/${address}`);

    return response.data.data;
  }

  /**
   * Get contract info
   */
  async getContractInfo(contractAddress: string): Promise<{
    address: string;
    codeId: number;
    creator: string;
    admin?: string;
    label: string;
    created: {
      blockHeight: number;
      txHash: string;
    };
  }> {
    const response = await this.explorerClient.get<{
      data: {
        address: string;
        codeId: string;
        creator: string;
        admin?: string;
        label: string;
        created: {
          blockHeight: string;
          txHash: string;
        };
      };
    }>(`/api/explorer/v1/wasm/contracts/${contractAddress}`);

    const d = response.data.data;
    return {
      address: d.address,
      codeId: parseInt(d.codeId, 10),
      creator: d.creator,
      admin: d.admin,
      label: d.label,
      created: {
        blockHeight: parseInt(d.created.blockHeight, 10),
        txHash: d.created.txHash,
      },
    };
  }

  // ==================== Chronos API (Historical Data) ====================

  /**
   * Get market candles (OHLCV)
   */
  async getMarketCandles(params: {
    marketId: string;
    resolution: string; // '1m', '5m', '15m', '1h', '4h', '1d'
    from?: number;
    to?: number;
  }): Promise<MarketCandle[]> {
    const response = await this.chronosClient.get<{
      candles: Array<{
        t: number;
        o: string;
        h: string;
        l: string;
        c: string;
        v: string;
      }>;
    }>('/api/v1/candles', { params });

    return response.data.candles.map((c) => ({
      timestamp: c.t,
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
      volume: c.v,
    }));
  }

  /**
   * Get market 24h statistics
   */
  async getMarket24hStats(marketId: string): Promise<{
    high: string;
    low: string;
    open: string;
    close: string;
    volume: string;
    change: string;
    changePercent: string;
  }> {
    const response = await this.chronosClient.get<{
      stats: {
        high: string;
        low: string;
        open: string;
        close: string;
        volume: string;
        change: string;
        changePercent: string;
      };
    }>(`/api/v1/markets/${marketId}/stats`);

    return response.data.stats;
  }

  /**
   * Get market volumes
   */
  async getMarketVolumes(): Promise<MarketVolume[]> {
    const response = await this.chronosClient.get<{
      volumes: MarketVolume[];
    }>('/api/v1/volumes');

    return response.data.volumes;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(params?: {
    type?: 'pnl' | 'volume';
    period?: '24h' | '7d' | '30d';
    limit?: number;
  }): Promise<Array<{
    address: string;
    pnl?: string;
    volume?: string;
    rank: number;
  }>> {
    const response = await this.chronosClient.get<{
      leaderboard: Array<{
        address: string;
        pnl?: string;
        volume?: string;
        rank: number;
      }>;
    }>('/api/v1/leaderboard', { params });

    return response.data.leaderboard;
  }

  /**
   * Get historical prices
   */
  async getHistoricalPrices(params: {
    symbol: string;
    from?: number;
    to?: number;
    resolution?: string;
  }): Promise<Array<{
    timestamp: number;
    price: string;
  }>> {
    const response = await this.chronosClient.get<{
      prices: Array<{
        timestamp: number;
        price: string;
      }>;
    }>('/api/v1/prices', { params });

    return response.data.prices;
  }

  /**
   * Get protocol statistics
   */
  async getProtocolStats(): Promise<{
    totalVolume24h: string;
    totalVolume7d: string;
    totalVolume30d: string;
    totalTrades24h: number;
    totalUsers: number;
    totalMarkets: number;
    tvl: string;
  }> {
    const response = await this.chronosClient.get<{
      stats: {
        totalVolume24h: string;
        totalVolume7d: string;
        totalVolume30d: string;
        totalTrades24h: string;
        totalUsers: string;
        totalMarkets: string;
        tvl: string;
      };
    }>('/api/v1/stats');

    const s = response.data.stats;
    return {
      totalVolume24h: s.totalVolume24h,
      totalVolume7d: s.totalVolume7d,
      totalVolume30d: s.totalVolume30d,
      totalTrades24h: parseInt(s.totalTrades24h, 10),
      totalUsers: parseInt(s.totalUsers, 10),
      totalMarkets: parseInt(s.totalMarkets, 10),
      tvl: s.tvl,
    };
  }
}

/**
 * Create an Indexer client from n8n credentials
 */
export async function createIndexerClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialName: string = 'injectiveApi'
): Promise<IndexerClient> {
  const credentials = await context.getCredentials(credentialName);

  const config: IndexerClientConfig = {
    network: (credentials.environment as string) || 'mainnet',
    explorerApiEndpoint: credentials.explorerApiEndpoint as string | undefined,
    chronosApiEndpoint: credentials.chronosApiEndpoint as string | undefined,
    apiKey: credentials.apiKey as string | undefined,
  };

  return new IndexerClient(config);
}
