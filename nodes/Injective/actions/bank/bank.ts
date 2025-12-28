/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createInjectiveClient } from '../transport/injectiveClient';
import { fromInj, fromBaseUnits } from '../utils/unitConverter';
import { getDenomInfo } from '../constants/denoms';

/**
 * Bank Resource Operations
 *
 * Operations for querying and transferring tokens using the
 * Cosmos SDK Bank module on Injective.
 */

export const bankOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['bank'],
      },
    },
    options: [
      {
        name: 'Get Balance',
        value: 'getBalance',
        description: 'Get balance of a specific token',
        action: 'Get balance',
      },
      {
        name: 'Get All Balances',
        value: 'getAllBalances',
        description: 'Get all token balances for an address',
        action: 'Get all balances',
      },
      {
        name: 'Get Total Supply',
        value: 'getTotalSupply',
        description: 'Get total supply of a token',
        action: 'Get total supply',
      },
      {
        name: 'Get Spendable Balances',
        value: 'getSpendableBalances',
        description: 'Get spendable (non-vesting) balances',
        action: 'Get spendable balances',
      },
    ],
    default: 'getBalance',
  },
];

export const bankFields: INodeProperties[] = [
  // Address field
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'inj1...',
    description: 'Injective address',
    displayOptions: {
      show: {
        resource: ['bank'],
        operation: ['getBalance', 'getAllBalances', 'getSpendableBalances'],
      },
    },
  },
  // Denom field for getBalance
  {
    displayName: 'Denom',
    name: 'denom',
    type: 'string',
    required: true,
    default: 'inj',
    placeholder: 'inj or peggy0x...',
    description: 'Token denomination (e.g., "inj" for native INJ)',
    displayOptions: {
      show: {
        resource: ['bank'],
        operation: ['getBalance', 'getTotalSupply'],
      },
    },
  },
];

/**
 * Execute bank operations
 */
export async function executeBankOperation(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    const client = await createInjectiveClient(this);

    switch (operation) {
      case 'getBalance': {
        const address = this.getNodeParameter('address', index) as string;
        const denom = this.getNodeParameter('denom', index) as string;
        
        const balance = await client.getBalance(address, denom);
        const denomInfo = getDenomInfo(denom);
        
        let amountFormatted = balance.amount;
        if (denomInfo) {
          amountFormatted = fromBaseUnits(balance.amount, denomInfo.decimals);
        } else if (denom === 'inj') {
          amountFormatted = fromInj(balance.amount);
        }
        
        returnData.push({
          json: {
            denom: balance.denom,
            amount: balance.amount,
            amountFormatted,
            symbol: denomInfo?.symbol || denom,
          },
        });
        break;
      }

      case 'getAllBalances': {
        const address = this.getNodeParameter('address', index) as string;
        const balances = await client.getAllBalances(address);
        
        const formattedBalances = balances.map((b) => {
          const denomInfo = getDenomInfo(b.denom);
          let amountFormatted = b.amount;
          
          if (denomInfo) {
            amountFormatted = fromBaseUnits(b.amount, denomInfo.decimals);
          } else if (b.denom === 'inj') {
            amountFormatted = fromInj(b.amount);
          }
          
          return {
            denom: b.denom,
            amount: b.amount,
            amountFormatted,
            symbol: denomInfo?.symbol || b.denom,
          };
        });
        
        returnData.push({
          json: {
            address,
            balances: formattedBalances,
            count: balances.length,
          },
        });
        break;
      }

      case 'getTotalSupply': {
        const denom = this.getNodeParameter('denom', index) as string;
        const supplies = await client.getTotalSupply(denom);
        
        const formattedSupplies = supplies.map((s) => {
          const denomInfo = getDenomInfo(s.denom);
          let amountFormatted = s.amount;
          
          if (denomInfo) {
            amountFormatted = fromBaseUnits(s.amount, denomInfo.decimals);
          } else if (s.denom === 'inj') {
            amountFormatted = fromInj(s.amount);
          }
          
          return {
            denom: s.denom,
            totalSupply: s.amount,
            totalSupplyFormatted: amountFormatted,
            symbol: denomInfo?.symbol || s.denom,
          };
        });
        
        returnData.push({
          json: {
            supplies: formattedSupplies,
          },
        });
        break;
      }

      case 'getSpendableBalances': {
        const address = this.getNodeParameter('address', index) as string;
        // Spendable balances are same as regular balances for non-vesting accounts
        const balances = await client.getAllBalances(address);
        
        const formattedBalances = balances.map((b) => {
          const denomInfo = getDenomInfo(b.denom);
          let amountFormatted = b.amount;
          
          if (denomInfo) {
            amountFormatted = fromBaseUnits(b.amount, denomInfo.decimals);
          } else if (b.denom === 'inj') {
            amountFormatted = fromInj(b.amount);
          }
          
          return {
            denom: b.denom,
            spendableAmount: b.amount,
            spendableAmountFormatted: amountFormatted,
            symbol: denomInfo?.symbol || b.denom,
          };
        });
        
        returnData.push({
          json: {
            address,
            spendableBalances: formattedBalances,
            count: balances.length,
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
