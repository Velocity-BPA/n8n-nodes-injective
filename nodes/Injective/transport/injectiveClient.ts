/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getNetworkConfig, NetworkConfig, NETWORKS } from '../constants/networks';

/**
 * Injective Chain Client
 *
 * Handles communication with Injective blockchain via REST/LCD endpoints.
 * Used for on-chain queries and transaction broadcasting.
 */

export interface InjectiveClientConfig {
  network: string;
  restEndpoint?: string;
  grpcEndpoint?: string;
  wsEndpoint?: string;
  mnemonic?: string;
  privateKey?: string;
  derivationPath?: string;
  accountIndex?: number;
}

export interface TransactionResult {
  txHash: string;
  code: number;
  rawLog: string;
  gasUsed: string;
  gasWanted: string;
  height: number;
  data?: string;
}

export interface AccountInfo {
  address: string;
  accountNumber: string;
  sequence: string;
  pubKey?: {
    type: string;
    value: string;
  };
}

export class InjectiveClient {
  private config: NetworkConfig;
  private httpClient: AxiosInstance;
  private walletAddress?: string;

  constructor(clientConfig: InjectiveClientConfig) {
    // Get network config or use custom endpoints
    if (clientConfig.network === 'custom') {
      this.config = {
        name: 'Custom Network',
        chainId: 'custom',
        grpcEndpoint: clientConfig.grpcEndpoint || '',
        restEndpoint: clientConfig.restEndpoint || '',
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

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.config.restEndpoint,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log licensing notice once (non-blocking)
    this.logLicensingNotice();
  }

  private logLicensingNotice(): void {
    console.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`);
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(): NetworkConfig {
    return this.config;
  }

  /**
   * Make a REST API request
   */
  async request<T>(
    method: 'GET' | 'POST',
    path: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.httpClient.request<T>({
        method,
        url: path,
        data: method === 'POST' ? data : undefined,
        params: method === 'GET' ? data : undefined,
        ...config,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Injective API error: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Get node info
   */
  async getNodeInfo(): Promise<{
    nodeInfo: {
      network: string;
      version: string;
      moniker: string;
    };
    syncInfo: {
      latestBlockHeight: string;
      latestBlockTime: string;
      catchingUp: boolean;
    };
  }> {
    const response = await this.request<{
      default_node_info: {
        network: string;
        version: string;
        moniker: string;
      };
      sync_info: {
        latest_block_height: string;
        latest_block_time: string;
        catching_up: boolean;
      };
    }>('GET', '/cosmos/base/tendermint/v1beta1/node_info');

    return {
      nodeInfo: {
        network: response.default_node_info.network,
        version: response.default_node_info.version,
        moniker: response.default_node_info.moniker,
      },
      syncInfo: {
        latestBlockHeight: response.sync_info.latest_block_height,
        latestBlockTime: response.sync_info.latest_block_time,
        catchingUp: response.sync_info.catching_up,
      },
    };
  }

  /**
   * Get account info
   */
  async getAccount(address: string): Promise<AccountInfo> {
    try {
      const response = await this.request<{
        account: {
          '@type': string;
          base_account?: {
            address: string;
            account_number: string;
            sequence: string;
            pub_key?: {
              '@type': string;
              key: string;
            };
          };
          address?: string;
          account_number?: string;
          sequence?: string;
        };
      }>('GET', `/cosmos/auth/v1beta1/accounts/${address}`);

      const account = response.account;
      const baseAccount = account.base_account || account;

      return {
        address: baseAccount.address || address,
        accountNumber: baseAccount.account_number || '0',
        sequence: baseAccount.sequence || '0',
        pubKey: baseAccount.pub_key
          ? {
              type: baseAccount.pub_key['@type'],
              value: baseAccount.pub_key.key,
            }
          : undefined,
      };
    } catch (error) {
      // Account may not exist yet
      return {
        address,
        accountNumber: '0',
        sequence: '0',
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance(
    address: string,
    denom: string = 'inj'
  ): Promise<{ denom: string; amount: string }> {
    const response = await this.request<{
      balance: {
        denom: string;
        amount: string;
      };
    }>('GET', `/cosmos/bank/v1beta1/balances/${address}/by_denom`, { denom });

    return response.balance;
  }

  /**
   * Get all balances for an account
   */
  async getAllBalances(
    address: string
  ): Promise<Array<{ denom: string; amount: string }>> {
    const response = await this.request<{
      balances: Array<{
        denom: string;
        amount: string;
      }>;
    }>('GET', `/cosmos/bank/v1beta1/balances/${address}`);

    return response.balances;
  }

  /**
   * Get total supply of a denom
   */
  async getTotalSupply(denom?: string): Promise<Array<{ denom: string; amount: string }>> {
    const path = denom
      ? `/cosmos/bank/v1beta1/supply/by_denom?denom=${encodeURIComponent(denom)}`
      : '/cosmos/bank/v1beta1/supply';
    
    const response = await this.request<{
      supply?: Array<{ denom: string; amount: string }>;
      amount?: { denom: string; amount: string };
    }>('GET', path);

    if (response.amount) {
      return [response.amount];
    }
    return response.supply || [];
  }

  /**
   * Get validators
   */
  async getValidators(
    status: 'BOND_STATUS_BONDED' | 'BOND_STATUS_UNBONDED' | 'BOND_STATUS_UNBONDING' = 'BOND_STATUS_BONDED'
  ): Promise<Array<{
    operatorAddress: string;
    moniker: string;
    tokens: string;
    commission: string;
    status: string;
  }>> {
    const response = await this.request<{
      validators: Array<{
        operator_address: string;
        description: {
          moniker: string;
        };
        tokens: string;
        commission: {
          commission_rates: {
            rate: string;
          };
        };
        status: string;
      }>;
    }>('GET', '/cosmos/staking/v1beta1/validators', { status });

    return response.validators.map((v) => ({
      operatorAddress: v.operator_address,
      moniker: v.description.moniker,
      tokens: v.tokens,
      commission: v.commission.commission_rates.rate,
      status: v.status,
    }));
  }

  /**
   * Get delegations for an address
   */
  async getDelegations(
    delegatorAddress: string
  ): Promise<Array<{
    validatorAddress: string;
    shares: string;
    balance: { denom: string; amount: string };
  }>> {
    const response = await this.request<{
      delegation_responses: Array<{
        delegation: {
          validator_address: string;
          shares: string;
        };
        balance: {
          denom: string;
          amount: string;
        };
      }>;
    }>('GET', `/cosmos/staking/v1beta1/delegations/${delegatorAddress}`);

    return response.delegation_responses.map((d) => ({
      validatorAddress: d.delegation.validator_address,
      shares: d.delegation.shares,
      balance: d.balance,
    }));
  }

  /**
   * Get staking rewards
   */
  async getStakingRewards(
    delegatorAddress: string
  ): Promise<{
    total: Array<{ denom: string; amount: string }>;
    rewards: Array<{
      validatorAddress: string;
      reward: Array<{ denom: string; amount: string }>;
    }>;
  }> {
    const response = await this.request<{
      total: Array<{ denom: string; amount: string }>;
      rewards: Array<{
        validator_address: string;
        reward: Array<{ denom: string; amount: string }>;
      }>;
    }>('GET', `/cosmos/distribution/v1beta1/delegators/${delegatorAddress}/rewards`);

    return {
      total: response.total,
      rewards: response.rewards.map((r) => ({
        validatorAddress: r.validator_address,
        reward: r.reward,
      })),
    };
  }

  /**
   * Get governance proposals
   */
  async getProposals(
    status?: string
  ): Promise<Array<{
    proposalId: string;
    title: string;
    status: string;
    submitTime: string;
    votingEndTime: string;
  }>> {
    const params: Record<string, string> = {};
    if (status) {
      params.proposal_status = status;
    }

    const response = await this.request<{
      proposals: Array<{
        proposal_id?: string;
        id?: string;
        title?: string;
        content?: { title: string };
        status: string;
        submit_time: string;
        voting_end_time: string;
      }>;
    }>('GET', '/cosmos/gov/v1beta1/proposals', params);

    return response.proposals.map((p) => ({
      proposalId: p.proposal_id || p.id || '',
      title: p.title || p.content?.title || '',
      status: p.status,
      submitTime: p.submit_time,
      votingEndTime: p.voting_end_time,
    }));
  }

  /**
   * Get IBC channels
   */
  async getIBCChannels(): Promise<Array<{
    channelId: string;
    portId: string;
    state: string;
    counterparty: {
      channelId: string;
      portId: string;
    };
  }>> {
    const response = await this.request<{
      channels: Array<{
        channel_id: string;
        port_id: string;
        state: string;
        counterparty: {
          channel_id: string;
          port_id: string;
        };
      }>;
    }>('GET', '/ibc/core/channel/v1/channels');

    return response.channels.map((c) => ({
      channelId: c.channel_id,
      portId: c.port_id,
      state: c.state,
      counterparty: {
        channelId: c.counterparty.channel_id,
        portId: c.counterparty.port_id,
      },
    }));
  }

  /**
   * Broadcast a signed transaction
   */
  async broadcastTx(
    txBytes: string,
    mode: 'BROADCAST_MODE_SYNC' | 'BROADCAST_MODE_ASYNC' | 'BROADCAST_MODE_BLOCK' = 'BROADCAST_MODE_SYNC'
  ): Promise<TransactionResult> {
    const response = await this.request<{
      tx_response: {
        txhash: string;
        code: number;
        raw_log: string;
        gas_used: string;
        gas_wanted: string;
        height: string;
        data?: string;
      };
    }>('POST', '/cosmos/tx/v1beta1/txs', {
      tx_bytes: txBytes,
      mode,
    });

    return {
      txHash: response.tx_response.txhash,
      code: response.tx_response.code,
      rawLog: response.tx_response.raw_log,
      gasUsed: response.tx_response.gas_used,
      gasWanted: response.tx_response.gas_wanted,
      height: parseInt(response.tx_response.height, 10),
      data: response.tx_response.data,
    };
  }

  /**
   * Simulate a transaction
   */
  async simulateTx(txBytes: string): Promise<{
    gasUsed: string;
    gasWanted: string;
  }> {
    const response = await this.request<{
      gas_info: {
        gas_used: string;
        gas_wanted: string;
      };
    }>('POST', '/cosmos/tx/v1beta1/simulate', {
      tx_bytes: txBytes,
    });

    return {
      gasUsed: response.gas_info.gas_used,
      gasWanted: response.gas_info.gas_wanted,
    };
  }

  /**
   * Get transaction by hash
   */
  async getTx(txHash: string): Promise<{
    txHash: string;
    height: string;
    code: number;
    rawLog: string;
    gasUsed: string;
    gasWanted: string;
    timestamp: string;
  }> {
    const response = await this.request<{
      tx_response: {
        txhash: string;
        height: string;
        code: number;
        raw_log: string;
        gas_used: string;
        gas_wanted: string;
        timestamp: string;
      };
    }>('GET', `/cosmos/tx/v1beta1/txs/${txHash}`);

    return {
      txHash: response.tx_response.txhash,
      height: response.tx_response.height,
      code: response.tx_response.code,
      rawLog: response.tx_response.raw_log,
      gasUsed: response.tx_response.gas_used,
      gasWanted: response.tx_response.gas_wanted,
      timestamp: response.tx_response.timestamp,
    };
  }
}

/**
 * Create an Injective client from n8n credentials
 */
export async function createInjectiveClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialName: string = 'injectiveNetwork'
): Promise<InjectiveClient> {
  const credentials = await context.getCredentials(credentialName);

  const config: InjectiveClientConfig = {
    network: credentials.network as string,
    restEndpoint: credentials.restEndpoint as string | undefined,
    grpcEndpoint: credentials.grpcEndpoint as string | undefined,
    wsEndpoint: credentials.wsEndpoint as string | undefined,
    mnemonic: credentials.mnemonic as string | undefined,
    privateKey: credentials.privateKey as string | undefined,
    derivationPath: credentials.derivationPath as string | undefined,
    accountIndex: credentials.accountIndex as number | undefined,
  };

  return new InjectiveClient(config);
}
