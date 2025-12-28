/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, ITriggerFunctions } from 'n8n-workflow';
import WebSocket from 'ws';
import { getNetworkConfig, NetworkConfig } from '../constants/networks';

/**
 * Injective Stream Client
 *
 * Handles WebSocket connections to Injective streaming APIs.
 * Provides real-time updates for orderbooks, trades, orders, and positions.
 */

export interface StreamClientConfig {
  network: string;
  wsEndpoint?: string;
}

export type StreamEventType =
  | 'orderbook'
  | 'trade'
  | 'order'
  | 'position'
  | 'balance'
  | 'oracle'
  | 'subaccount';

export interface StreamSubscription {
  type: StreamEventType;
  marketId?: string;
  subaccountId?: string;
  callback: (data: unknown) => void;
}

export interface StreamMessage {
  type: string;
  channel: string;
  data: unknown;
}

export class StreamClient {
  private config: NetworkConfig;
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, StreamSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor(clientConfig: StreamClientConfig) {
    if (clientConfig.network === 'custom') {
      this.config = {
        name: 'Custom Network',
        chainId: 'custom',
        grpcEndpoint: '',
        restEndpoint: '',
        wsEndpoint: clientConfig.wsEndpoint || '',
        indexerGrpcEndpoint: '',
        indexerRestEndpoint: '',
        exchangeApiEndpoint: '',
        explorerApiEndpoint: '',
        chronosApiEndpoint: '',
        evmRpcUrl: '',
        evmChainId: 1,
      };
    } else {
      this.config = getNetworkConfig(clientConfig.network);
    }
  }

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.wsEndpoint);

        this.ws.on('open', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startPingInterval();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data);
        });

        this.ws.on('close', () => {
          this.isConnected = false;
          this.stopPingInterval();
          this.handleReconnect();
        });

        this.ws.on('error', (error: Error) => {
          if (!this.isConnected) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.subscriptions.clear();
  }

  /**
   * Check connection status
   */
  isActive(): boolean {
    return this.isConnected && this.ws !== null;
  }

  /**
   * Subscribe to orderbook updates
   */
  subscribeOrderbook(
    marketId: string,
    callback: (data: unknown) => void
  ): string {
    const subscriptionId = `orderbook:${marketId}`;
    
    this.subscriptions.set(subscriptionId, {
      type: 'orderbook',
      marketId,
      callback,
    });

    this.send({
      type: 'subscribe',
      channel: 'orderbook',
      marketId,
    });

    return subscriptionId;
  }

  /**
   * Subscribe to trade updates
   */
  subscribeTrades(
    marketId: string,
    callback: (data: unknown) => void
  ): string {
    const subscriptionId = `trade:${marketId}`;
    
    this.subscriptions.set(subscriptionId, {
      type: 'trade',
      marketId,
      callback,
    });

    this.send({
      type: 'subscribe',
      channel: 'trades',
      marketId,
    });

    return subscriptionId;
  }

  /**
   * Subscribe to order updates
   */
  subscribeOrders(
    subaccountId: string,
    marketId?: string,
    callback?: (data: unknown) => void
  ): string {
    const subscriptionId = marketId
      ? `order:${subaccountId}:${marketId}`
      : `order:${subaccountId}`;
    
    if (callback) {
      this.subscriptions.set(subscriptionId, {
        type: 'order',
        subaccountId,
        marketId,
        callback,
      });
    }

    this.send({
      type: 'subscribe',
      channel: 'orders',
      subaccountId,
      marketId,
    });

    return subscriptionId;
  }

  /**
   * Subscribe to position updates
   */
  subscribePositions(
    subaccountId: string,
    marketId?: string,
    callback?: (data: unknown) => void
  ): string {
    const subscriptionId = marketId
      ? `position:${subaccountId}:${marketId}`
      : `position:${subaccountId}`;
    
    if (callback) {
      this.subscriptions.set(subscriptionId, {
        type: 'position',
        subaccountId,
        marketId,
        callback,
      });
    }

    this.send({
      type: 'subscribe',
      channel: 'positions',
      subaccountId,
      marketId,
    });

    return subscriptionId;
  }

  /**
   * Subscribe to balance updates
   */
  subscribeBalances(
    subaccountId: string,
    callback: (data: unknown) => void
  ): string {
    const subscriptionId = `balance:${subaccountId}`;
    
    this.subscriptions.set(subscriptionId, {
      type: 'balance',
      subaccountId,
      callback,
    });

    this.send({
      type: 'subscribe',
      channel: 'balances',
      subaccountId,
    });

    return subscriptionId;
  }

  /**
   * Subscribe to oracle price updates
   */
  subscribeOracle(
    symbol: string,
    callback: (data: unknown) => void
  ): string {
    const subscriptionId = `oracle:${symbol}`;
    
    this.subscriptions.set(subscriptionId, {
      type: 'oracle',
      callback,
    });

    this.send({
      type: 'subscribe',
      channel: 'oracle',
      symbol,
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    const [channel, ...params] = subscriptionId.split(':');
    
    this.send({
      type: 'unsubscribe',
      channel,
      ...(params.length > 0 && { marketId: params[0] }),
      ...(params.length > 1 && { subaccountId: params[1] }),
    });

    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Send a message through WebSocket
   */
  private send(message: Record<string, unknown>): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString()) as StreamMessage;
      
      // Find matching subscriptions
      for (const [_id, subscription] of this.subscriptions) {
        if (this.matchesSubscription(message, subscription)) {
          subscription.callback(message.data);
        }
      }
    } catch (_error) {
      // Ignore parse errors for ping/pong frames
    }
  }

  /**
   * Check if a message matches a subscription
   */
  private matchesSubscription(
    message: StreamMessage,
    subscription: StreamSubscription
  ): boolean {
    if (message.channel !== subscription.type) {
      return false;
    }

    // Additional matching logic based on marketId/subaccountId if needed
    return true;
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect().catch(() => {
        // Reconnect failed, will try again
      });
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        this.ws.ping();
      }
    }, 30000);
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Get current subscriptions
   */
  getSubscriptions(): Map<string, StreamSubscription> {
    return new Map(this.subscriptions);
  }
}

/**
 * Create a Stream client from n8n credentials
 */
export async function createStreamClient(
  context: IExecuteFunctions | ITriggerFunctions,
  credentialName: string = 'injectiveNetwork'
): Promise<StreamClient> {
  const credentials = await context.getCredentials(credentialName);

  const config: StreamClientConfig = {
    network: credentials.network as string,
    wsEndpoint: credentials.wsEndpoint as string | undefined,
  };

  const client = new StreamClient(config);
  await client.connect();
  
  return client;
}
