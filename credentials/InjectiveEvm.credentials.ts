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
 * Credential type for Injective EVM (inEVM) access.
 * Injective supports Ethereum-compatible smart contracts
 * through its EVM layer.
 *
 * This allows interaction with Ethereum-style contracts
 * deployed on Injective using standard EVM tooling.
 */
export class InjectiveEvm implements ICredentialType {
  name = 'injectiveEvm';
  displayName = 'Injective EVM';
  documentationUrl = 'https://docs.injective.network/develop/guides/evm/';

  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        {
          name: 'Mainnet',
          value: 'mainnet',
          description: 'Injective Mainnet EVM',
        },
        {
          name: 'Testnet',
          value: 'testnet',
          description: 'Injective Testnet EVM',
        },
        {
          name: 'Custom',
          value: 'custom',
          description: 'Custom EVM RPC endpoint',
        },
      ],
      default: 'mainnet',
      description: 'Select the EVM network',
    },
    {
      displayName: 'EVM RPC URL',
      name: 'evmRpcUrl',
      type: 'string',
      default: '',
      placeholder: 'https://evm.injective.network',
      description: 'Custom EVM RPC endpoint URL',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'number',
      default: 1,
      description: 'EVM Chain ID (Mainnet: 1, Testnet: 888)',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      placeholder: '0x...',
      description: 'Ethereum-format private key (hex). NEVER share this with anyone.',
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.network === "mainnet" ? "https://evm.injective.network" : $credentials.network === "testnet" ? "https://testnet.evm.injective.network" : $credentials.evmRpcUrl}}',
      url: '/',
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  };
}
