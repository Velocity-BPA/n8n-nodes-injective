/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createInjectiveClient } from '../transport/injectiveClient';
import { createExchangeClient } from '../transport/exchangeClient';
import { fromInj } from '../utils/unitConverter';

/**
 * Account Resource Operations
 *
 * Operations for querying account information, balances,
 * and subaccount data on Injective.
 */

export const accountOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['account'],
      },
    },
    options: [
      {
        name: 'Get Account Info',
        value: 'getAccountInfo',
        description: 'Get account information including sequence and account number',
        action: 'Get account info',
      },
      {
        name: 'Get All Balances',
        value: 'getAllBalances',
        description: 'Get all token balances for an account',
        action: 'Get all balances',
      },
      {
        name: 'Get INJ Balance',
        value: 'getInjBalance',
        description: 'Get INJ token balance for an account',
        action: 'Get INJ balance',
      },
      {
        name: 'Get Subaccount Balances',
        value: 'getSubaccountBalances',
        description: 'Get balances for a specific subaccount',
        action: 'Get subaccount balances',
      },
      {
        name: 'Get Subaccounts',
        value: 'getSubaccounts',
        description: 'Get all subaccounts for an address',
        action: 'Get subaccounts',
      },
      {
        name: 'Get Portfolio',
        value: 'getPortfolio',
        description: 'Get portfolio value and summary',
        action: 'Get portfolio',
      },
      {
        name: 'Validate Address',
        value: 'validateAddress',
        description: 'Check if an address is a valid Injective address',
        action: 'Validate address',
      },
    ],
    default: 'getAccountInfo',
  },
];

export const accountFields: INodeProperties[] = [
  // Address field - used by multiple operations
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'inj1...',
    description: 'Injective address (starts with inj1)',
    displayOptions: {
      show: {
        resource: ['account'],
        operation: [
          'getAccountInfo',
          'getInjBalance',
          'getAllBalances',
          'getSubaccounts',
          'getPortfolio',
          'validateAddress',
        ],
      },
    },
  },
  // Subaccount ID field
  {
    displayName: 'Subaccount ID',
    name: 'subaccountId',
    type: 'string',
    required: true,
    default: '',
    placeholder: '0x...',
    description: 'Subaccount ID (66 character hex string)',
    displayOptions: {
      show: {
        resource: ['account'],
        operation: ['getSubaccountBalances'],
      },
    },
  },
];

/**
 * Execute account operations
 */
export async function executeAccountOperation(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    switch (operation) {
      case 'getAccountInfo': {
        const address = this.getNodeParameter('address', index) as string;
        const client = await createInjectiveClient(this);
        const account = await client.getAccount(address);
        
        returnData.push({
          json: {
            address: account.address,
            accountNumber: account.accountNumber,
            sequence: account.sequence,
            pubKey: account.pubKey,
          },
        });
        break;
      }

      case 'getInjBalance': {
        const address = this.getNodeParameter('address', index) as string;
        const client = await createInjectiveClient(this);
        const balance = await client.getBalance(address, 'inj');
        
        returnData.push({
          json: {
            denom: balance.denom,
            amount: balance.amount,
            amountFormatted: fromInj(balance.amount),
            symbol: 'INJ',
          },
        });
        break;
      }

      case 'getAllBalances': {
        const address = this.getNodeParameter('address', index) as string;
        const client = await createInjectiveClient(this);
        const balances = await client.getAllBalances(address);
        
        returnData.push({
          json: {
            address,
            balances: balances.map((b) => ({
              denom: b.denom,
              amount: b.amount,
              // Format INJ specially
              amountFormatted: b.denom === 'inj' ? fromInj(b.amount) : b.amount,
            })),
            count: balances.length,
          },
        });
        break;
      }

      case 'getSubaccounts': {
        const address = this.getNodeParameter('address', index) as string;
        const client = await createExchangeClient(this, 'injectiveApi');
        const subaccounts = await client.getSubaccounts(address);
        
        returnData.push({
          json: {
            address,
            subaccounts,
            count: subaccounts.length,
          },
        });
        break;
      }

      case 'getSubaccountBalances': {
        const subaccountId = this.getNodeParameter('subaccountId', index) as string;
        const client = await createExchangeClient(this, 'injectiveApi');
        const balances = await client.getSubaccountBalances(subaccountId);
        
        returnData.push({
          json: {
            subaccountId,
            balances: balances.map((b) => ({
              denom: b.denom,
              totalBalance: b.deposit.totalBalance,
              availableBalance: b.deposit.availableBalance,
            })),
            count: balances.length,
          },
        });
        break;
      }

      case 'getPortfolio': {
        const address = this.getNodeParameter('address', index) as string;
        const client = await createExchangeClient(this, 'injectiveApi');
        const portfolio = await client.getPortfolio(address);
        
        returnData.push({
          json: {
            address,
            portfolioValue: portfolio.portfolioValue,
            availableBalance: portfolio.availableBalance,
            lockedBalance: portfolio.lockedBalance,
            unrealizedPnl: portfolio.unrealizedPnl,
          },
        });
        break;
      }

      case 'validateAddress': {
        const address = this.getNodeParameter('address', index) as string;
        
        // Basic validation for Injective addresses
        const isValid = /^inj1[a-z0-9]{38}$/.test(address);
        
        returnData.push({
          json: {
            address,
            isValid,
            format: isValid ? 'bech32' : 'invalid',
            prefix: isValid ? 'inj' : null,
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
