/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  ICredentialDataDecryptedObject,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * Credential type for connecting to Injective blockchain networks.
 * Supports mainnet, testnet, devnet, and custom endpoints.
 *
 * Security Note: Mnemonic phrases and private keys are never logged
 * and are encrypted at rest by n8n.
 */
export class InjectiveNetwork implements ICredentialType {
  name = 'injectiveNetwork';
  displayName = 'Injective Network';
  documentationUrl = 'https://docs.injective.network/';

  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        {
          name: 'Mainnet',
          value: 'mainnet',
          description: 'Injective Mainnet (Production)',
        },
        {
          name: 'Testnet',
          value: 'testnet',
          description: 'Injective Testnet (Testing)',
        },
        {
          name: 'Devnet',
          value: 'devnet',
          description: 'Injective Devnet (Development)',
        },
        {
          name: 'Custom',
          value: 'custom',
          description: 'Custom network endpoints',
        },
      ],
      default: 'mainnet',
      description: 'Select the Injective network to connect to',
    },
    {
      displayName: 'gRPC Endpoint',
      name: 'grpcEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://sentry.chain.grpc.injective.network',
      description: 'Custom gRPC endpoint URL',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'REST/LCD Endpoint',
      name: 'restEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://sentry.lcd.injective.network',
      description: 'Custom REST/LCD endpoint URL',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'WebSocket Endpoint',
      name: 'wsEndpoint',
      type: 'string',
      default: '',
      placeholder: 'wss://sentry.chain.stream.injective.network',
      description: 'Custom WebSocket endpoint URL for streaming',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Authentication Method',
      name: 'authMethod',
      type: 'options',
      options: [
        {
          name: 'Mnemonic Phrase',
          value: 'mnemonic',
          description: '24-word recovery phrase',
        },
        {
          name: 'Private Key',
          value: 'privateKey',
          description: 'Hex-encoded private key',
        },
        {
          name: 'Read Only',
          value: 'readOnly',
          description: 'Query-only access (no signing)',
        },
      ],
      default: 'mnemonic',
      description: 'Method for wallet authentication',
    },
    {
      displayName: 'Mnemonic Phrase',
      name: 'mnemonic',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      placeholder: 'word1 word2 word3 ... word24',
      description: '24-word mnemonic phrase for wallet access. NEVER share this with anyone.',
      displayOptions: {
        show: {
          authMethod: ['mnemonic'],
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
      description: 'Hex-encoded private key. NEVER share this with anyone.',
      displayOptions: {
        show: {
          authMethod: ['privateKey'],
        },
      },
    },
    {
      displayName: 'Derivation Path',
      name: 'derivationPath',
      type: 'string',
      default: "m/44'/60'/0'/0/0",
      description: 'BIP44 derivation path (default for Injective/Ethereum)',
      displayOptions: {
        show: {
          authMethod: ['mnemonic'],
        },
      },
    },
    {
      displayName: 'Account Index',
      name: 'accountIndex',
      type: 'number',
      default: 0,
      description: 'Account index for HD wallet derivation',
      displayOptions: {
        show: {
          authMethod: ['mnemonic'],
        },
      },
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.network === "mainnet" ? "https://sentry.lcd.injective.network" : $credentials.network === "testnet" ? "https://testnet.sentry.lcd.injective.network" : $credentials.network === "devnet" ? "https://devnet.lcd.injective.network" : $credentials.restEndpoint}}',
      url: '/cosmos/base/tendermint/v1beta1/node_info',
      method: 'GET',
    },
  };
}
