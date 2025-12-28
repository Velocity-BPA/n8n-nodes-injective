/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createExchangeClient } from '../transport/exchangeClient';
import { calculateMidPrice, calculateSpread } from '../utils/marketUtils';

/**
 * Exchange Resource Operations
 *
 * Operations for querying market data from the Injective Exchange.
 * Includes spot and derivative markets, orderbooks, trades, and stats.
 */

export const exchangeOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['exchange'],
      },
    },
    options: [
      {
        name: 'Get Derivative Markets',
        value: 'getDerivativeMarkets',
        description: 'Get all derivative (perpetual) markets',
        action: 'Get derivative markets',
      },
      {
        name: 'Get Market Info',
        value: 'getMarketInfo',
        description: 'Get detailed info for a specific market',
        action: 'Get market info',
      },
      {
        name: 'Get Orderbook',
        value: 'getOrderbook',
        description: 'Get orderbook for a market',
        action: 'Get orderbook',
      },
      {
        name: 'Get Spot Markets',
        value: 'getSpotMarkets',
        description: 'Get all spot markets',
        action: 'Get spot markets',
      },
      {
        name: 'Get Trades',
        value: 'getTrades',
        description: 'Get recent trades for a market',
        action: 'Get trades',
      },
      {
        name: 'Get Funding Rate',
        value: 'getFundingRate',
        description: 'Get current funding rate for a derivative market',
        action: 'Get funding rate',
      },
      {
        name: 'Get Oracle Price',
        value: 'getOraclePrice',
        description: 'Get oracle price for a symbol',
        action: 'Get oracle price',
      },
    ],
    default: 'getSpotMarkets',
  },
];

export const exchangeFields: INodeProperties[] = [
  // Market Type field
  {
    displayName: 'Market Type',
    name: 'marketType',
    type: 'options',
    options: [
      { name: 'Spot', value: 'spot' },
      { name: 'Derivative', value: 'derivative' },
    ],
    default: 'spot',
    description: 'Type of market',
    displayOptions: {
      show: {
        resource: ['exchange'],
        operation: ['getMarketInfo', 'getOrderbook', 'getTrades'],
      },
    },
  },
  // Market ID field
  {
    displayName: 'Market ID',
    name: 'marketId',
    type: 'string',
    required: true,
    default: '',
    placeholder: '0x...',
    description: 'Market ID (hex string)',
    displayOptions: {
      show: {
        resource: ['exchange'],
        operation: ['getMarketInfo', 'getOrderbook', 'getTrades', 'getFundingRate'],
      },
    },
  },
  // Market Status filter
  {
    displayName: 'Market Status',
    name: 'marketStatus',
    type: 'options',
    options: [
      { name: 'All', value: '' },
      { name: 'Active', value: 'active' },
      { name: 'Paused', value: 'paused' },
      { name: 'Demolished', value: 'demolished' },
    ],
    default: 'active',
    description: 'Filter markets by status',
    displayOptions: {
      show: {
        resource: ['exchange'],
        operation: ['getSpotMarkets', 'getDerivativeMarkets'],
      },
    },
  },
  // Limit field for trades
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 100,
    description: 'Maximum number of trades to return',
    displayOptions: {
      show: {
        resource: ['exchange'],
        operation: ['getTrades'],
      },
    },
  },
  // Oracle fields
  {
    displayName: 'Base Symbol',
    name: 'baseSymbol',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'INJ',
    description: 'Base asset symbol',
    displayOptions: {
      show: {
        resource: ['exchange'],
        operation: ['getOraclePrice'],
      },
    },
  },
  {
    displayName: 'Quote Symbol',
    name: 'quoteSymbol',
    type: 'string',
    required: true,
    default: 'USD',
    placeholder: 'USD',
    description: 'Quote asset symbol',
    displayOptions: {
      show: {
        resource: ['exchange'],
        operation: ['getOraclePrice'],
      },
    },
  },
  {
    displayName: 'Oracle Type',
    name: 'oracleType',
    type: 'options',
    options: [
      { name: 'Band', value: 'band' },
      { name: 'Pyth', value: 'pyth' },
      { name: 'Chainlink', value: 'chainlink' },
    ],
    default: 'band',
    description: 'Oracle provider type',
    displayOptions: {
      show: {
        resource: ['exchange'],
        operation: ['getOraclePrice'],
      },
    },
  },
];

/**
 * Execute exchange operations
 */
export async function executeExchangeOperation(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    const client = await createExchangeClient(this, 'injectiveApi');

    switch (operation) {
      case 'getSpotMarkets': {
        const marketStatus = this.getNodeParameter('marketStatus', index) as string;
        const markets = await client.getSpotMarkets(marketStatus || undefined);
        
        returnData.push({
          json: {
            markets: markets.map((m) => ({
              marketId: m.marketId,
              ticker: m.ticker,
              baseDenom: m.baseDenom,
              quoteDenom: m.quoteDenom,
              status: m.marketStatus,
              makerFeeRate: m.makerFeeRate,
              takerFeeRate: m.takerFeeRate,
              minPriceTickSize: m.minPriceTickSize,
              minQuantityTickSize: m.minQuantityTickSize,
            })),
            count: markets.length,
          },
        });
        break;
      }

      case 'getDerivativeMarkets': {
        const marketStatus = this.getNodeParameter('marketStatus', index) as string;
        const markets = await client.getDerivativeMarkets(marketStatus || undefined);
        
        returnData.push({
          json: {
            markets: markets.map((m) => ({
              marketId: m.marketId,
              ticker: m.ticker,
              oracleBase: m.oracleBase,
              oracleQuote: m.oracleQuote,
              oracleType: m.oracleType,
              quoteDenom: m.quoteDenom,
              status: m.marketStatus,
              makerFeeRate: m.makerFeeRate,
              takerFeeRate: m.takerFeeRate,
              initialMarginRatio: m.initialMarginRatio,
              maintenanceMarginRatio: m.maintenanceMarginRatio,
              isPerpetual: m.isPerpetual,
              minPriceTickSize: m.minPriceTickSize,
              minQuantityTickSize: m.minQuantityTickSize,
            })),
            count: markets.length,
          },
        });
        break;
      }

      case 'getMarketInfo': {
        const marketType = this.getNodeParameter('marketType', index) as string;
        const marketId = this.getNodeParameter('marketId', index) as string;
        
        if (marketType === 'spot') {
          const market = await client.getSpotMarket(marketId);
          returnData.push({
            json: {
              marketType: 'spot',
              ...market,
            },
          });
        } else {
          const market = await client.getDerivativeMarket(marketId);
          returnData.push({
            json: {
              marketType: 'derivative',
              ...market,
            },
          });
        }
        break;
      }

      case 'getOrderbook': {
        const marketType = this.getNodeParameter('marketType', index) as string;
        const marketId = this.getNodeParameter('marketId', index) as string;
        
        const orderbook = marketType === 'spot'
          ? await client.getSpotOrderbook(marketId)
          : await client.getDerivativeOrderbook(marketId);
        
        const midPrice = calculateMidPrice({
          bids: orderbook.buys.map((b) => ({ price: b.price, quantity: b.quantity })),
          asks: orderbook.sells.map((s) => ({ price: s.price, quantity: s.quantity })),
          timestamp: orderbook.timestamp,
        });
        
        const spread = calculateSpread({
          bids: orderbook.buys.map((b) => ({ price: b.price, quantity: b.quantity })),
          asks: orderbook.sells.map((s) => ({ price: s.price, quantity: s.quantity })),
          timestamp: orderbook.timestamp,
        });
        
        returnData.push({
          json: {
            marketId,
            marketType,
            bids: orderbook.buys.slice(0, 20),
            asks: orderbook.sells.slice(0, 20),
            midPrice,
            spread,
            sequence: orderbook.sequence,
            timestamp: orderbook.timestamp,
          },
        });
        break;
      }

      case 'getTrades': {
        const marketType = this.getNodeParameter('marketType', index) as string;
        const marketId = this.getNodeParameter('marketId', index) as string;
        const limit = this.getNodeParameter('limit', index) as number;
        
        const trades = marketType === 'spot'
          ? await client.getSpotTrades({ marketId, limit })
          : await client.getDerivativeTrades({ marketId, limit });
        
        returnData.push({
          json: {
            marketId,
            marketType,
            trades: trades.map((t) => ({
              tradeId: t.tradeId,
              orderHash: t.orderHash,
              price: t.executionPrice,
              quantity: t.executionQuantity,
              side: t.executionSide,
              direction: t.tradeDirection,
              fee: t.fee,
              isLiquidation: t.isLiquidation,
              executedAt: t.executedAt,
            })),
            count: trades.length,
          },
        });
        break;
      }

      case 'getFundingRate': {
        const marketId = this.getNodeParameter('marketId', index) as string;
        const fundingRates = await client.getFundingRates(marketId);
        
        returnData.push({
          json: {
            marketId,
            fundingRates: fundingRates.fundingRates,
          },
        });
        break;
      }

      case 'getOraclePrice': {
        const baseSymbol = this.getNodeParameter('baseSymbol', index) as string;
        const quoteSymbol = this.getNodeParameter('quoteSymbol', index) as string;
        const oracleType = this.getNodeParameter('oracleType', index) as string;
        
        const price = await client.getOraclePrice(baseSymbol, quoteSymbol, oracleType);
        
        returnData.push({
          json: {
            baseSymbol,
            quoteSymbol,
            oracleType,
            price: price.price,
          },
        });
        break;
      }

      default:
        throw new Error(`Operation ${operation} is not supported`);
    }
  } catch (error) {
    if (this.continueOnFail()) {
      returnData.push({
        json: {
          error: (error as Error).message,
        },
      });
    } else {
      throw error;
    }
  }

  return returnData;
}
