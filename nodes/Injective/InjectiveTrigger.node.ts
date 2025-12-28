/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  ITriggerFunctions,
  INodeType,
  INodeTypeDescription,
  ITriggerResponse,
} from 'n8n-workflow';

import { StreamClient, StreamClientConfig } from './transport/streamClient';
import { getNetworkConfig } from './constants/networks';

/**
 * Injective Trigger Node
 *
 * Real-time event monitoring for the Injective blockchain.
 * Uses WebSocket connections to receive instant updates on:
 * - Balance changes
 * - Order updates
 * - Position changes
 * - Trade executions
 * - Price movements
 */
export class InjectiveTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Injective Trigger',
    name: 'injectiveTrigger',
    icon: 'file:injective.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["event"]}}',
    description: 'Triggers on Injective blockchain events in real-time',
    defaults: {
      name: 'Injective Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'injectiveNetwork',
        required: true,
      },
      {
        name: 'injectiveApi',
        required: false,
      },
    ],
    properties: [
      // Event Type Selection
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        options: [
          {
            name: 'Balance Changed',
            value: 'balanceChanged',
            description: 'Trigger when account balance changes',
          },
          {
            name: 'Order Filled',
            value: 'orderFilled',
            description: 'Trigger when an order is filled',
          },
          {
            name: 'Order Placed',
            value: 'orderPlaced',
            description: 'Trigger when a new order is placed',
          },
          {
            name: 'Order Cancelled',
            value: 'orderCancelled',
            description: 'Trigger when an order is cancelled',
          },
          {
            name: 'Position Changed',
            value: 'positionChanged',
            description: 'Trigger when a position changes',
          },
          {
            name: 'Position Liquidated',
            value: 'positionLiquidated',
            description: 'Trigger when a position is liquidated',
          },
          {
            name: 'Trade Executed',
            value: 'tradeExecuted',
            description: 'Trigger on trade execution',
          },
          {
            name: 'Price Alert',
            value: 'priceAlert',
            description: 'Trigger when price reaches a threshold',
          },
          {
            name: 'New Block',
            value: 'newBlock',
            description: 'Trigger on each new block',
          },
        ],
        default: 'tradeExecuted',
        description: 'The event to trigger on',
      },

      // Market ID for trade/order events
      {
        displayName: 'Market ID',
        name: 'marketId',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'Market ID to monitor (leave empty for all markets)',
        displayOptions: {
          show: {
            event: [
              'orderFilled',
              'orderPlaced',
              'orderCancelled',
              'tradeExecuted',
              'positionChanged',
              'positionLiquidated',
              'priceAlert',
            ],
          },
        },
      },

      // Subaccount ID for account-specific events
      {
        displayName: 'Subaccount ID',
        name: 'subaccountId',
        type: 'string',
        default: '',
        placeholder: '0x...',
        description: 'Subaccount ID to monitor (required for account-specific events)',
        displayOptions: {
          show: {
            event: [
              'balanceChanged',
              'orderFilled',
              'orderPlaced',
              'orderCancelled',
              'positionChanged',
              'positionLiquidated',
            ],
          },
        },
      },

      // Price threshold for price alerts
      {
        displayName: 'Price Threshold',
        name: 'priceThreshold',
        type: 'number',
        default: 0,
        description: 'Price level to trigger alert',
        displayOptions: {
          show: {
            event: ['priceAlert'],
          },
        },
      },

      // Price direction for alerts
      {
        displayName: 'Trigger When',
        name: 'priceDirection',
        type: 'options',
        options: [
          { name: 'Price Goes Above', value: 'above' },
          { name: 'Price Goes Below', value: 'below' },
          { name: 'Any Price Change', value: 'any' },
        ],
        default: 'above',
        description: 'When to trigger the price alert',
        displayOptions: {
          show: {
            event: ['priceAlert'],
          },
        },
      },
    ],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const event = this.getNodeParameter('event') as string;
    const marketId = this.getNodeParameter('marketId', '') as string;
    const subaccountId = this.getNodeParameter('subaccountId', '') as string;

    // Log licensing notice
    this.logger.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`);

    let streamClient: StreamClient | null = null;

    const startTrigger = async () => {
      try {
        const credentials = await this.getCredentials('injectiveNetwork');
        
        const config: StreamClientConfig = {
          network: credentials.network as string,
          wsEndpoint: credentials.wsEndpoint as string | undefined,
        };

        // If custom network, use the custom endpoint
        if (config.network !== 'custom') {
          const networkConfig = getNetworkConfig(config.network);
          config.wsEndpoint = networkConfig.wsEndpoint;
        }

        streamClient = new StreamClient(config);
        await streamClient.connect();

        // Set up the appropriate subscription based on event type
        switch (event) {
          case 'balanceChanged':
            if (subaccountId) {
              streamClient.subscribeBalances(subaccountId, (data) => {
                this.emit([this.helpers.returnJsonArray([{ event: 'balanceChanged', data }])]);
              });
            }
            break;

          case 'orderFilled':
          case 'orderPlaced':
          case 'orderCancelled':
            if (subaccountId) {
              streamClient.subscribeOrders(subaccountId, marketId || undefined, (data) => {
                // Filter by event type
                const orderData = data as { state?: string };
                if (
                  (event === 'orderFilled' && orderData.state === 'filled') ||
                  (event === 'orderPlaced' && orderData.state === 'booked') ||
                  (event === 'orderCancelled' && orderData.state === 'canceled')
                ) {
                  this.emit([this.helpers.returnJsonArray([{ event, data }])]);
                }
              });
            }
            break;

          case 'positionChanged':
          case 'positionLiquidated':
            if (subaccountId) {
              streamClient.subscribePositions(subaccountId, marketId || undefined, (data) => {
                const posData = data as { isLiquidation?: boolean };
                if (event === 'positionLiquidated' && !posData.isLiquidation) {
                  return;
                }
                this.emit([this.helpers.returnJsonArray([{ event, data }])]);
              });
            }
            break;

          case 'tradeExecuted':
            if (marketId) {
              streamClient.subscribeTrades(marketId, (data) => {
                this.emit([this.helpers.returnJsonArray([{ event: 'tradeExecuted', data }])]);
              });
            }
            break;

          case 'priceAlert':
            if (marketId) {
              const priceThreshold = this.getNodeParameter('priceThreshold') as number;
              const priceDirection = this.getNodeParameter('priceDirection') as string;
              let lastPrice: number | null = null;

              streamClient.subscribeTrades(marketId, (data) => {
                const tradeData = data as { executionPrice?: string };
                const currentPrice = parseFloat(tradeData.executionPrice || '0');

                if (lastPrice !== null) {
                  const triggered =
                    (priceDirection === 'above' && currentPrice >= priceThreshold && lastPrice < priceThreshold) ||
                    (priceDirection === 'below' && currentPrice <= priceThreshold && lastPrice > priceThreshold) ||
                    (priceDirection === 'any');

                  if (triggered) {
                    this.emit([this.helpers.returnJsonArray([{
                      event: 'priceAlert',
                      marketId,
                      price: currentPrice,
                      threshold: priceThreshold,
                      direction: priceDirection,
                      previousPrice: lastPrice,
                    }])]);
                  }
                }
                lastPrice = currentPrice;
              });
            }
            break;

          case 'newBlock':
            // Note: New block subscription would typically use a different endpoint
            // This is a placeholder for the pattern
            this.logger.info('New block monitoring started');
            break;

          default:
            throw new Error(`Event '${event}' is not supported`);
        }

        this.logger.info(`Injective trigger started for event: ${event}`);
      } catch (error) {
        this.logger.error(`Failed to start Injective trigger: ${(error as Error).message}`);
        throw error;
      }
    };

    const stopTrigger = async () => {
      if (streamClient) {
        streamClient.disconnect();
        streamClient = null;
      }
      this.logger.info('Injective trigger stopped');
    };

    await startTrigger();

    return {
      closeFunction: stopTrigger,
    };
  }
}
