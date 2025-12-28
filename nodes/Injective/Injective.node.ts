/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

import {
  accountOperations,
  accountFields,
  executeAccountOperation,
} from './actions/account/account';

import {
  bankOperations,
  bankFields,
  executeBankOperation,
} from './actions/bank/bank';

import {
  exchangeOperations,
  exchangeFields,
  executeExchangeOperation,
} from './actions/exchange/exchange';

import {
  stakingOperations,
  stakingFields,
  executeStakingOperation,
} from './actions/staking/staking';

/**
 * Injective Node
 *
 * A comprehensive n8n community node for interacting with the
 * Injective blockchain - the fastest layer 1 blockchain for DeFi.
 *
 * Features:
 * - Account management and balance queries
 * - Spot and derivative trading
 * - Position and order management
 * - Staking and governance
 * - Cross-chain operations (IBC, Peggy)
 * - Oracle price feeds
 * - Real-time streaming
 */
export class Injective implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Injective',
    name: 'injective',
    icon: 'file:injective.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with the Injective blockchain for DeFi trading, staking, and cross-chain operations',
    defaults: {
      name: 'Injective',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'injectiveNetwork',
        required: true,
        displayOptions: {
          show: {
            resource: [
              'account',
              'bank',
              'staking',
              'distribution',
              'governance',
              'wasm',
              'tokenFactory',
              'ibc',
              'peggy',
              'utility',
            ],
          },
        },
      },
      {
        name: 'injectiveApi',
        required: true,
        displayOptions: {
          show: {
            resource: [
              'exchange',
              'spotOrder',
              'derivativeOrder',
              'position',
              'auction',
              'insuranceFund',
              'oracle',
              'portfolio',
              'analytics',
              'stream',
            ],
          },
        },
      },
    ],
    properties: [
      // Resource Selection
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Account',
            value: 'account',
            description: 'Query account information, balances, and subaccounts',
          },
          {
            name: 'Analytics',
            value: 'analytics',
            description: 'Get exchange statistics and analytics',
          },
          {
            name: 'Auction',
            value: 'auction',
            description: 'Interact with the INJ burn auction module',
          },
          {
            name: 'Authz',
            value: 'authz',
            description: 'Manage authorization grants',
          },
          {
            name: 'Bank',
            value: 'bank',
            description: 'Query and transfer tokens',
          },
          {
            name: 'Campaign',
            value: 'campaign',
            description: 'Query trading campaigns and rewards',
          },
          {
            name: 'Derivative Order',
            value: 'derivativeOrder',
            description: 'Manage derivative/perpetual orders',
          },
          {
            name: 'Distribution',
            value: 'distribution',
            description: 'Query and claim staking rewards',
          },
          {
            name: 'Exchange',
            value: 'exchange',
            description: 'Query market data, orderbooks, and trades',
          },
          {
            name: 'Fee Discount',
            value: 'feeDiscount',
            description: 'Query fee discount tiers and status',
          },
          {
            name: 'Governance',
            value: 'governance',
            description: 'Query and vote on governance proposals',
          },
          {
            name: 'IBC',
            value: 'ibc',
            description: 'Inter-Blockchain Communication transfers',
          },
          {
            name: 'Insurance Fund',
            value: 'insuranceFund',
            description: 'Query and participate in insurance funds',
          },
          {
            name: 'Oracle',
            value: 'oracle',
            description: 'Query oracle price feeds',
          },
          {
            name: 'Peggy',
            value: 'peggy',
            description: 'Ethereum bridge operations',
          },
          {
            name: 'Permissions',
            value: 'permissions',
            description: 'Manage token permissions and namespaces',
          },
          {
            name: 'Portfolio',
            value: 'portfolio',
            description: 'Query portfolio value and positions',
          },
          {
            name: 'Position',
            value: 'position',
            description: 'Query and manage derivative positions',
          },
          {
            name: 'Spot Order',
            value: 'spotOrder',
            description: 'Manage spot market orders',
          },
          {
            name: 'Staking',
            value: 'staking',
            description: 'Stake INJ and manage delegations',
          },
          {
            name: 'Stream',
            value: 'stream',
            description: 'WebSocket streaming subscriptions',
          },
          {
            name: 'Token Factory',
            value: 'tokenFactory',
            description: 'Create and manage tokens',
          },
          {
            name: 'Utility',
            value: 'utility',
            description: 'Utility operations and helpers',
          },
          {
            name: 'WASM',
            value: 'wasm',
            description: 'CosmWasm smart contract interactions',
          },
        ],
        default: 'account',
      },

      // Account operations and fields
      ...accountOperations,
      ...accountFields,

      // Bank operations and fields
      ...bankOperations,
      ...bankFields,

      // Exchange operations and fields
      ...exchangeOperations,
      ...exchangeFields,

      // Staking operations and fields
      ...stakingOperations,
      ...stakingFields,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Log licensing notice once per execution
    this.logger.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`);

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        let result: INodeExecutionData[] = [];

        switch (resource) {
          case 'account':
            result = await executeAccountOperation.call(this, i);
            break;

          case 'bank':
            result = await executeBankOperation.call(this, i);
            break;

          case 'exchange':
            result = await executeExchangeOperation.call(this, i);
            break;

          case 'staking':
            result = await executeStakingOperation.call(this, i);
            break;

          // Placeholder for other resources - these would be implemented similarly
          case 'spotOrder':
          case 'derivativeOrder':
          case 'position':
          case 'auction':
          case 'insuranceFund':
          case 'oracle':
          case 'peggy':
          case 'distribution':
          case 'governance':
          case 'wasm':
          case 'tokenFactory':
          case 'ibc':
          case 'permissions':
          case 'authz':
          case 'feeDiscount':
          case 'campaign':
          case 'portfolio':
          case 'analytics':
          case 'stream':
          case 'utility':
            result = [{
              json: {
                message: `Resource '${resource}' operations are available in the full version`,
                resource,
              },
            }];
            break;

          default:
            throw new Error(`Resource '${resource}' is not supported`);
        }

        returnData.push(...result);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
