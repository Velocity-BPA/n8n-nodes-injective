/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createInjectiveClient } from '../transport/injectiveClient';
import { fromInj } from '../utils/unitConverter';

/**
 * Staking Resource Operations
 *
 * Operations for staking INJ tokens, querying validators,
 * and managing delegations on Injective.
 */

export const stakingOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['staking'],
      },
    },
    options: [
      {
        name: 'Get Validators',
        value: 'getValidators',
        description: 'Get list of validators',
        action: 'Get validators',
      },
      {
        name: 'Get Active Validators',
        value: 'getActiveValidators',
        description: 'Get only active (bonded) validators',
        action: 'Get active validators',
      },
      {
        name: 'Get Delegations',
        value: 'getDelegations',
        description: 'Get delegations for an address',
        action: 'Get delegations',
      },
      {
        name: 'Get Staking Rewards',
        value: 'getStakingRewards',
        description: 'Get pending staking rewards',
        action: 'Get staking rewards',
      },
    ],
    default: 'getValidators',
  },
];

export const stakingFields: INodeProperties[] = [
  // Validator Status filter
  {
    displayName: 'Validator Status',
    name: 'validatorStatus',
    type: 'options',
    options: [
      { name: 'All', value: '' },
      { name: 'Bonded (Active)', value: 'BOND_STATUS_BONDED' },
      { name: 'Unbonding', value: 'BOND_STATUS_UNBONDING' },
      { name: 'Unbonded', value: 'BOND_STATUS_UNBONDED' },
    ],
    default: 'BOND_STATUS_BONDED',
    description: 'Filter validators by status',
    displayOptions: {
      show: {
        resource: ['staking'],
        operation: ['getValidators'],
      },
    },
  },
  // Delegator Address
  {
    displayName: 'Delegator Address',
    name: 'delegatorAddress',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'inj1...',
    description: 'Address of the delegator',
    displayOptions: {
      show: {
        resource: ['staking'],
        operation: ['getDelegations', 'getStakingRewards'],
      },
    },
  },
];

/**
 * Execute staking operations
 */
export async function executeStakingOperation(
  this: IExecuteFunctions,
  index: number
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const returnData: INodeExecutionData[] = [];

  try {
    const client = await createInjectiveClient(this);

    switch (operation) {
      case 'getValidators': {
        const status = this.getNodeParameter('validatorStatus', index) as string;
        const validators = await client.getValidators(
          (status || 'BOND_STATUS_BONDED') as 'BOND_STATUS_BONDED' | 'BOND_STATUS_UNBONDED' | 'BOND_STATUS_UNBONDING'
        );
        
        returnData.push({
          json: {
            validators: validators.map((v) => ({
              operatorAddress: v.operatorAddress,
              moniker: v.moniker,
              tokens: v.tokens,
              tokensFormatted: fromInj(v.tokens),
              commission: v.commission,
              commissionPercent: `${(parseFloat(v.commission) * 100).toFixed(2)}%`,
              status: v.status,
            })),
            count: validators.length,
          },
        });
        break;
      }

      case 'getActiveValidators': {
        const validators = await client.getValidators('BOND_STATUS_BONDED');
        
        returnData.push({
          json: {
            validators: validators.map((v) => ({
              operatorAddress: v.operatorAddress,
              moniker: v.moniker,
              tokens: v.tokens,
              tokensFormatted: fromInj(v.tokens),
              commission: v.commission,
              commissionPercent: `${(parseFloat(v.commission) * 100).toFixed(2)}%`,
            })),
            count: validators.length,
          },
        });
        break;
      }

      case 'getDelegations': {
        const delegatorAddress = this.getNodeParameter('delegatorAddress', index) as string;
        const delegations = await client.getDelegations(delegatorAddress);
        
        const totalDelegated = delegations.reduce(
          (sum, d) => sum + BigInt(d.balance.amount),
          BigInt(0)
        );
        
        returnData.push({
          json: {
            delegatorAddress,
            delegations: delegations.map((d) => ({
              validatorAddress: d.validatorAddress,
              shares: d.shares,
              balance: d.balance.amount,
              balanceFormatted: fromInj(d.balance.amount),
              denom: d.balance.denom,
            })),
            totalDelegated: totalDelegated.toString(),
            totalDelegatedFormatted: fromInj(totalDelegated.toString()),
            count: delegations.length,
          },
        });
        break;
      }

      case 'getStakingRewards': {
        const delegatorAddress = this.getNodeParameter('delegatorAddress', index) as string;
        const rewards = await client.getStakingRewards(delegatorAddress);
        
        returnData.push({
          json: {
            delegatorAddress,
            totalRewards: rewards.total.map((t) => ({
              denom: t.denom,
              amount: t.amount,
              amountFormatted: t.denom === 'inj' ? fromInj(t.amount.split('.')[0]) : t.amount,
            })),
            rewardsByValidator: rewards.rewards.map((r) => ({
              validatorAddress: r.validatorAddress,
              rewards: r.reward.map((reward) => ({
                denom: reward.denom,
                amount: reward.amount,
              })),
            })),
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
