/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * Credential type for Injective API services.
 * Includes Indexer, Exchange, and Explorer API endpoints.
 *
 * The Indexer provides fast access to indexed blockchain data,
 * while the Exchange API provides trading-specific endpoints.
 */
export class InjectiveApi implements ICredentialType {
  name = 'injectiveApi';
  displayName = 'Injective API';
  documentationUrl = 'https://api.injective.exchange/';

  properties: INodeProperties[] = [
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      options: [
        {
          name: 'Mainnet',
          value: 'mainnet',
          description: 'Production API endpoints',
        },
        {
          name: 'Testnet',
          value: 'testnet',
          description: 'Testnet API endpoints',
        },
        {
          name: 'Custom',
          value: 'custom',
          description: 'Custom API endpoints',
        },
      ],
      default: 'mainnet',
      description: 'Select the API environment',
    },
    {
      displayName: 'Indexer gRPC Endpoint',
      name: 'indexerGrpcEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://sentry.exchange.grpc.injective.network',
      description: 'Indexer gRPC endpoint for fast data queries',
      displayOptions: {
        show: {
          environment: ['custom'],
        },
      },
    },
    {
      displayName: 'Indexer REST Endpoint',
      name: 'indexerRestEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://sentry.exchange.rest.injective.network',
      description: 'Indexer REST endpoint for HTTP queries',
      displayOptions: {
        show: {
          environment: ['custom'],
        },
      },
    },
    {
      displayName: 'Exchange API Endpoint',
      name: 'exchangeApiEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://api.injective.exchange',
      description: 'Exchange API endpoint for trading data',
      displayOptions: {
        show: {
          environment: ['custom'],
        },
      },
    },
    {
      displayName: 'Explorer API Endpoint',
      name: 'explorerApiEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://explorer-api.injective.network',
      description: 'Explorer API endpoint for transaction and block data',
      displayOptions: {
        show: {
          environment: ['custom'],
        },
      },
    },
    {
      displayName: 'Chronos API Endpoint',
      name: 'chronosApiEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://chronos-api.injective.network',
      description: 'Chronos API for historical market data',
      displayOptions: {
        show: {
          environment: ['custom'],
        },
      },
    },
    {
      displayName: 'API Key (Optional)',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Optional API key for rate limit increases',
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.environment === "mainnet" ? "https://sentry.lcd.injective.network" : $credentials.environment === "testnet" ? "https://testnet.sentry.lcd.injective.network" : $credentials.indexerRestEndpoint}}',
      url: '/cosmos/base/tendermint/v1beta1/node_info',
      method: 'GET',
    },
  };
}
