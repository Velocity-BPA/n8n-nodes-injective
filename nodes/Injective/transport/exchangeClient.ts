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
 * Injective Exchange Client
 *
 * Handles communication with Injective Exchange Indexer API.
 * Provides fast access to trading data, orderbooks, and market info.
 */

export interface ExchangeClientConfig {
  network: string;
  indexerRestEndpoint?: string;
  indexerGrpcEndpoint?: string;
  apiKey?: string;
}

export interface SpotMarket {
  marketId: string;
  marketStatus: string;
  ticker: string;
  baseDenom: string;
  quoteDenom: string;
  makerFeeRate: string;
  takerFeeRate: string;
  serviceProviderFee: string;
  minPriceTickSize: string;
  minQuantityTickSize: string;
}

export interface DerivativeMarket {
  marketId: string;
  marketStatus: string;
  ticker: string;
  oracleBase: string;
  oracleQuote: string;
  oracleType: string;
  quoteDenom: string;
  makerFeeRate: string;
  takerFeeRate: string;
  initialMarginRatio: string;
  maintenanceMarginRatio: string;
  minPriceTickSize: string;
  minQuantityTickSize: string;
  isPerpetual: boolean;
}

export interface OrderbookLevel {
  price: string;
  quantity: string;
  timestamp: number;
}

export interface Orderbook {
  buys: OrderbookLevel[];
  sells: OrderbookLevel[];
  sequence: number;
  timestamp: number;
}

export interface Trade {
  orderHash: string;
  subaccountId: string;
  marketId: string;
  tradeId: string;
  executionPrice: string;
  executionQuantity: string;
  fee: string;
  feeRecipient: string;
  isLiquidation: boolean;
  executedAt: number;
  executionSide: string;
  tradeDirection: string;
}

export interface Order {
  orderHash: string;
  orderSide: string;
  marketId: string;
  subaccountId: string;
  price: string;
  quantity: string;
  unfilledQuantity: string;
  triggerPrice?: string;
  feeRecipient: string;
  state: string;
  executionType: string;
  orderType: string;
  isReduceOnly: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Position {
  ticker: string;
  marketId: string;
  subaccountId: string;
  direction: string;
  quantity: string;
  entryPrice: string;
  margin: string;
  liquidationPrice: string;
  markPrice: string;
  aggregateReduceOnlyQuantity: string;
  cumulativeFundingEntry: string;
  createdAt: number;
  updatedAt: number;
}

export class ExchangeClient {
  private config: NetworkConfig;
  private httpClient: AxiosInstance;

  constructor(clientConfig: ExchangeClientConfig) {
    // Get network config or use custom endpoints
    if (clientConfig.network === 'custom') {
      this.config = {
        name: 'Custom Network',
        chainId: 'custom',
        grpcEndpoint: '',
        restEndpoint: '',
        wsEndpoint: '',
        indexerGrpcEndpoint: clientConfig.indexerGrpcEndpoint || '',
        indexerRestEndpoint: clientConfig.indexerRestEndpoint || '',
        exchangeApiEndpoint: clientConfig.indexerRestEndpoint || '',
        explorerApiEndpoint: '',
        chronosApiEndpoint: '',
        evmRpcUrl: '',
        evmChainId: 1,
      };
    } else {
      this.config = getNetworkConfig(clientConfig.network);
    }

    // Initialize HTTP client for indexer API
    this.httpClient = axios.create({
      baseURL: this.config.indexerRestEndpoint,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(clientConfig.apiKey ? { 'X-API-Key': clientConfig.apiKey } : {}),
      },
    });
  }

  /**
   * Make an API request
   */
  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    data?: Record<string, unknown>
  ): Promise<T> {
    try {
      const response = await this.httpClient.request<T>({
        method,
        url: path,
        data: method === 'POST' ? data : undefined,
        params: method === 'GET' ? data : undefined,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Exchange API error: ${message}`);
      }
      throw error;
    }
  }

  // ==================== Spot Markets ====================

  /**
   * Get all spot markets
   */
  async getSpotMarkets(marketStatus?: string): Promise<SpotMarket[]> {
    const params: Record<string, string> = {};
    if (marketStatus) {
      params.marketStatus = marketStatus;
    }

    const response = await this.request<{
      markets: Array<{
        marketId: string;
        marketStatus: string;
        ticker: string;
        baseDenom: string;
        quoteDenom: string;
        makerFeeRate: string;
        takerFeeRate: string;
        serviceProviderFee: string;
        minPriceTickSize: string;
        minQuantityTickSize: string;
      }>;
    }>('GET', '/api/exchange/spot/v1/markets', params);

    return response.markets;
  }

  /**
   * Get spot market by ID
   */
  async getSpotMarket(marketId: string): Promise<SpotMarket> {
    const response = await this.request<{
      market: SpotMarket;
    }>('GET', `/api/exchange/spot/v1/markets/${marketId}`);

    return response.market;
  }

  /**
   * Get spot orderbook
   */
  async getSpotOrderbook(marketId: string): Promise<Orderbook> {
    const response = await this.request<{
      orderbook: {
        buys: Array<{ price: string; quantity: string; timestamp: string }>;
        sells: Array<{ price: string; quantity: string; timestamp: string }>;
        sequence: string;
        timestamp: string;
      };
    }>('GET', `/api/exchange/spot/v1/orderbooks/${marketId}`);

    return {
      buys: response.orderbook.buys.map((b) => ({
        price: b.price,
        quantity: b.quantity,
        timestamp: parseInt(b.timestamp, 10),
      })),
      sells: response.orderbook.sells.map((s) => ({
        price: s.price,
        quantity: s.quantity,
        timestamp: parseInt(s.timestamp, 10),
      })),
      sequence: parseInt(response.orderbook.sequence, 10),
      timestamp: parseInt(response.orderbook.timestamp, 10),
    };
  }

  /**
   * Get spot trades
   */
  async getSpotTrades(params: {
    marketId?: string;
    subaccountId?: string;
    skip?: number;
    limit?: number;
  }): Promise<Trade[]> {
    const response = await this.request<{
      trades: Trade[];
    }>('GET', '/api/exchange/spot/v1/trades', params);

    return response.trades;
  }

  /**
   * Get spot orders
   */
  async getSpotOrders(params: {
    marketId?: string;
    subaccountId?: string;
    orderSide?: string;
    isConditional?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<Order[]> {
    const response = await this.request<{
      orders: Order[];
    }>('GET', '/api/exchange/spot/v1/orders', params);

    return response.orders;
  }

  // ==================== Derivative Markets ====================

  /**
   * Get all derivative markets
   */
  async getDerivativeMarkets(marketStatus?: string): Promise<DerivativeMarket[]> {
    const params: Record<string, string> = {};
    if (marketStatus) {
      params.marketStatus = marketStatus;
    }

    const response = await this.request<{
      markets: DerivativeMarket[];
    }>('GET', '/api/exchange/derivative/v1/markets', params);

    return response.markets;
  }

  /**
   * Get derivative market by ID
   */
  async getDerivativeMarket(marketId: string): Promise<DerivativeMarket> {
    const response = await this.request<{
      market: DerivativeMarket;
    }>('GET', `/api/exchange/derivative/v1/markets/${marketId}`);

    return response.market;
  }

  /**
   * Get derivative orderbook
   */
  async getDerivativeOrderbook(marketId: string): Promise<Orderbook> {
    const response = await this.request<{
      orderbook: {
        buys: Array<{ price: string; quantity: string; timestamp: string }>;
        sells: Array<{ price: string; quantity: string; timestamp: string }>;
        sequence: string;
        timestamp: string;
      };
    }>('GET', `/api/exchange/derivative/v1/orderbooks/${marketId}`);

    return {
      buys: response.orderbook.buys.map((b) => ({
        price: b.price,
        quantity: b.quantity,
        timestamp: parseInt(b.timestamp, 10),
      })),
      sells: response.orderbook.sells.map((s) => ({
        price: s.price,
        quantity: s.quantity,
        timestamp: parseInt(s.timestamp, 10),
      })),
      sequence: parseInt(response.orderbook.sequence, 10),
      timestamp: parseInt(response.orderbook.timestamp, 10),
    };
  }

  /**
   * Get derivative trades
   */
  async getDerivativeTrades(params: {
    marketId?: string;
    subaccountId?: string;
    skip?: number;
    limit?: number;
  }): Promise<Trade[]> {
    const response = await this.request<{
      trades: Trade[];
    }>('GET', '/api/exchange/derivative/v1/trades', params);

    return response.trades;
  }

  /**
   * Get derivative orders
   */
  async getDerivativeOrders(params: {
    marketId?: string;
    subaccountId?: string;
    orderSide?: string;
    isConditional?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<Order[]> {
    const response = await this.request<{
      orders: Order[];
    }>('GET', '/api/exchange/derivative/v1/orders', params);

    return response.orders;
  }

  /**
   * Get positions
   */
  async getPositions(params: {
    marketId?: string;
    subaccountId?: string;
    direction?: string;
    skip?: number;
    limit?: number;
  }): Promise<Position[]> {
    const response = await this.request<{
      positions: Position[];
    }>('GET', '/api/exchange/derivative/v1/positions', params);

    return response.positions;
  }

  /**
   * Get funding rates
   */
  async getFundingRates(marketId: string): Promise<{
    fundingRates: Array<{
      marketId: string;
      rate: string;
      timestamp: string;
    }>;
  }> {
    const response = await this.request<{
      fundingRates: Array<{
        marketId: string;
        rate: string;
        timestamp: string;
      }>;
    }>('GET', `/api/exchange/derivative/v1/funding_rates/${marketId}`);

    return response;
  }

  // ==================== Account / Subaccount ====================

  /**
   * Get subaccounts
   */
  async getSubaccounts(address: string): Promise<string[]> {
    const response = await this.request<{
      subaccounts: string[];
    }>('GET', `/api/exchange/account/v1/subaccounts/${address}`);

    return response.subaccounts;
  }

  /**
   * Get subaccount balances
   */
  async getSubaccountBalances(
    subaccountId: string
  ): Promise<Array<{ denom: string; deposit: { totalBalance: string; availableBalance: string } }>> {
    const response = await this.request<{
      balances: Array<{
        denom: string;
        deposit: {
          totalBalance: string;
          availableBalance: string;
        };
      }>;
    }>('GET', `/api/exchange/account/v1/subaccounts/${subaccountId}/balances`);

    return response.balances;
  }

  /**
   * Get subaccount history
   */
  async getSubaccountHistory(params: {
    subaccountId: string;
    denom?: string;
    transferTypes?: string[];
    skip?: number;
    limit?: number;
  }): Promise<Array<{
    transferType: string;
    srcSubaccountId: string;
    dstSubaccountId: string;
    amount: { denom: string; amount: string };
    executedAt: number;
  }>> {
    const response = await this.request<{
      transfers: Array<{
        transferType: string;
        srcSubaccountId: string;
        dstSubaccountId: string;
        amount: { denom: string; amount: string };
        executedAt: string;
      }>;
    }>('GET', '/api/exchange/account/v1/subaccount_history', params);

    return response.transfers.map((t) => ({
      ...t,
      executedAt: parseInt(t.executedAt, 10),
    }));
  }

  /**
   * Get portfolio value
   */
  async getPortfolio(
    accountAddress: string
  ): Promise<{
    portfolioValue: string;
    availableBalance: string;
    lockedBalance: string;
    unrealizedPnl: string;
  }> {
    const response = await this.request<{
      portfolio: {
        portfolioValue: string;
        availableBalance: string;
        lockedBalance: string;
        unrealizedPnl: string;
      };
    }>('GET', `/api/exchange/account/v1/portfolio/${accountAddress}`);

    return response.portfolio;
  }

  // ==================== Oracle ====================

  /**
   * Get oracle prices
   */
  async getOraclePrices(): Promise<Array<{
    symbol: string;
    price: string;
    oracleType: string;
  }>> {
    const response = await this.request<{
      prices: Array<{
        symbol: string;
        price: string;
        oracleType: string;
      }>;
    }>('GET', '/api/exchange/oracle/v1/prices');

    return response.prices;
  }

  /**
   * Get oracle price by symbol
   */
  async getOraclePrice(
    baseSymbol: string,
    quoteSymbol: string,
    oracleType: string
  ): Promise<{ price: string }> {
    const response = await this.request<{
      price: string;
    }>('GET', '/api/exchange/oracle/v1/price', {
      baseSymbol,
      quoteSymbol,
      oracleType,
    });

    return response;
  }

  // ==================== Insurance Fund ====================

  /**
   * Get insurance funds
   */
  async getInsuranceFunds(): Promise<Array<{
    marketId: string;
    marketTicker: string;
    deposit: { denom: string; amount: string };
    totalShare: string;
  }>> {
    const response = await this.request<{
      funds: Array<{
        marketId: string;
        marketTicker: string;
        deposit: { denom: string; amount: string };
        totalShare: string;
      }>;
    }>('GET', '/api/exchange/insurance/v1/funds');

    return response.funds;
  }

  // ==================== Auction ====================

  /**
   * Get current auction
   */
  async getCurrentAuction(): Promise<{
    basket: Array<{ denom: string; amount: string }>;
    round: string;
    endTimestamp: string;
    auctionStartTimestamp: string;
    highestBidder: string;
    highestBidAmount: string;
  }> {
    const response = await this.request<{
      auction: {
        basket: Array<{ denom: string; amount: string }>;
        round: string;
        endTimestamp: string;
        auctionStartTimestamp: string;
        highestBidder: string;
        highestBidAmount: string;
      };
    }>('GET', '/api/exchange/auction/v1/auction');

    return response.auction;
  }

  /**
   * Get auction history
   */
  async getAuctionHistory(round?: number): Promise<Array<{
    round: string;
    winner: string;
    amount: { denom: string; amount: string };
    timestamp: string;
  }>> {
    const params: Record<string, unknown> = {};
    if (round !== undefined) {
      params.round = round;
    }

    const response = await this.request<{
      auctions: Array<{
        round: string;
        winner: string;
        amount: { denom: string; amount: string };
        timestamp: string;
      }>;
    }>('GET', '/api/exchange/auction/v1/auctions', params);

    return response.auctions;
  }
}

/**
 * Create an Exchange client from n8n credentials
 */
export async function createExchangeClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialName: string = 'injectiveApi'
): Promise<ExchangeClient> {
  const credentials = await context.getCredentials(credentialName);

  const config: ExchangeClientConfig = {
    network: (credentials.environment as string) || 'mainnet',
    indexerRestEndpoint: credentials.indexerRestEndpoint as string | undefined,
    indexerGrpcEndpoint: credentials.indexerGrpcEndpoint as string | undefined,
    apiKey: credentials.apiKey as string | undefined,
  };

  return new ExchangeClient(config);
}
