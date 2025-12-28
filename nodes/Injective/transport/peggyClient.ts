/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import axios, { AxiosInstance } from 'axios';
import { getNetworkConfig, NetworkConfig } from '../constants/networks';
import { PEGGY_CONTRACTS } from '../constants/contracts';

/**
 * Injective Peggy Bridge Client
 *
 * Handles communication with the Peggy bridge for Ethereum<->Injective transfers.
 * Peggy is the trustless bridge that allows assets to flow between Ethereum and Injective.
 */

export interface PeggyClientConfig {
  network: string;
  restEndpoint?: string;
}

export interface PeggyDeposit {
  sender: string;
  receiver: string;
  eventNonce: string;
  blockHeight: string;
  amount: string;
  denom: string;
  orchestratorAddress: string;
  state: string;
  claimType: number;
  txHash: string;
}

export interface PeggyWithdrawal {
  sender: string;
  receiver: string;
  amount: string;
  denom: string;
  bridgeFee: string;
  outgoingTxId: string;
  batchTimeout: string;
  batchNonce: string;
  orchestratorAddress?: string;
  state: string;
  txHash?: string;
}

export interface PeggyParams {
  peggyId: string;
  contractSourceHash: string;
  bridgeEthereumAddress: string;
  bridgeChainId: string;
  signedValsetsWindow: string;
  signedBatchesWindow: string;
  signedClaimsWindow: string;
  targetBatchTimeout: string;
  averageBlockTime: string;
  averageEthereumBlockTime: string;
  slashFractionValset: string;
  slashFractionBatch: string;
  slashFractionClaim: string;
  slashFractionConflictingClaim: string;
  unbondSlashingValsetsWindow: string;
  cosmosCoinDenom: string;
  cosmosCoinErc20Contract: string;
  claimSlashingEnabled: boolean;
  bridgeContractStartHeight: string;
  valsetReward: { denom: string; amount: string };
}

export class PeggyClient {
  private config: NetworkConfig;
  private httpClient: AxiosInstance;
  private networkName: string;

  constructor(clientConfig: PeggyClientConfig) {
    this.networkName = clientConfig.network;
    
    if (clientConfig.network === 'custom') {
      this.config = {
        name: 'Custom Network',
        chainId: 'custom',
        grpcEndpoint: '',
        restEndpoint: clientConfig.restEndpoint || '',
        wsEndpoint: '',
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

    this.httpClient = axios.create({
      baseURL: this.config.restEndpoint,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get Peggy module parameters
   */
  async getParams(): Promise<PeggyParams> {
    const response = await this.httpClient.get<{
      params: {
        peggy_id: string;
        contract_source_hash: string;
        bridge_ethereum_address: string;
        bridge_chain_id: string;
        signed_valsets_window: string;
        signed_batches_window: string;
        signed_claims_window: string;
        target_batch_timeout: string;
        average_block_time: string;
        average_ethereum_block_time: string;
        slash_fraction_valset: string;
        slash_fraction_batch: string;
        slash_fraction_claim: string;
        slash_fraction_conflicting_claim: string;
        unbond_slashing_valsets_window: string;
        cosmos_coin_denom: string;
        cosmos_coin_erc20_contract: string;
        claim_slashing_enabled: boolean;
        bridge_contract_start_height: string;
        valset_reward: { denom: string; amount: string };
      };
    }>('/injective/peggy/v1/params');

    const p = response.data.params;
    return {
      peggyId: p.peggy_id,
      contractSourceHash: p.contract_source_hash,
      bridgeEthereumAddress: p.bridge_ethereum_address,
      bridgeChainId: p.bridge_chain_id,
      signedValsetsWindow: p.signed_valsets_window,
      signedBatchesWindow: p.signed_batches_window,
      signedClaimsWindow: p.signed_claims_window,
      targetBatchTimeout: p.target_batch_timeout,
      averageBlockTime: p.average_block_time,
      averageEthereumBlockTime: p.average_ethereum_block_time,
      slashFractionValset: p.slash_fraction_valset,
      slashFractionBatch: p.slash_fraction_batch,
      slashFractionClaim: p.slash_fraction_claim,
      slashFractionConflictingClaim: p.slash_fraction_conflicting_claim,
      unbondSlashingValsetsWindow: p.unbond_slashing_valsets_window,
      cosmosCoinDenom: p.cosmos_coin_denom,
      cosmosCoinErc20Contract: p.cosmos_coin_erc20_contract,
      claimSlashingEnabled: p.claim_slashing_enabled,
      bridgeContractStartHeight: p.bridge_contract_start_height,
      valsetReward: p.valset_reward,
    };
  }

  /**
   * Get deposits from Ethereum
   */
  async getDeposits(address?: string): Promise<PeggyDeposit[]> {
    const params: Record<string, string> = {};
    if (address) {
      params.address = address;
    }

    const response = await this.httpClient.get<{
      deposits: Array<{
        sender: string;
        receiver: string;
        event_nonce: string;
        block_height: string;
        amount: string;
        denom: string;
        orchestrator_address: string;
        state: string;
        claim_type: number;
        tx_hash: string;
      }>;
    }>('/injective/peggy/v1/deposits', { params });

    return response.data.deposits.map((d) => ({
      sender: d.sender,
      receiver: d.receiver,
      eventNonce: d.event_nonce,
      blockHeight: d.block_height,
      amount: d.amount,
      denom: d.denom,
      orchestratorAddress: d.orchestrator_address,
      state: d.state,
      claimType: d.claim_type,
      txHash: d.tx_hash,
    }));
  }

  /**
   * Get pending withdrawals to Ethereum
   */
  async getWithdrawals(address?: string): Promise<PeggyWithdrawal[]> {
    const params: Record<string, string> = {};
    if (address) {
      params.sender = address;
    }

    const response = await this.httpClient.get<{
      withdrawals: Array<{
        sender: string;
        receiver: string;
        amount: string;
        denom: string;
        bridge_fee: string;
        outgoing_tx_id: string;
        batch_timeout: string;
        batch_nonce: string;
        orchestrator_address?: string;
        state: string;
        tx_hash?: string;
      }>;
    }>('/injective/peggy/v1/batch/outgoing', { params });

    return response.data.withdrawals.map((w) => ({
      sender: w.sender,
      receiver: w.receiver,
      amount: w.amount,
      denom: w.denom,
      bridgeFee: w.bridge_fee,
      outgoingTxId: w.outgoing_tx_id,
      batchTimeout: w.batch_timeout,
      batchNonce: w.batch_nonce,
      orchestratorAddress: w.orchestrator_address,
      state: w.state,
      txHash: w.tx_hash,
    }));
  }

  /**
   * Get the current batch nonce
   */
  async getBatchNonce(tokenContract: string): Promise<string> {
    const response = await this.httpClient.get<{
      nonce: string;
    }>(`/injective/peggy/v1/batch/nonces/${tokenContract}`);

    return response.data.nonce;
  }

  /**
   * Get pending send to Ethereum transactions
   */
  async getPendingSendToEth(
    senderAddress: string
  ): Promise<Array<{
    id: string;
    sender: string;
    destAddress: string;
    erc20Token: { contract: string; amount: string };
    erc20Fee: { contract: string; amount: string };
  }>> {
    const response = await this.httpClient.get<{
      transfers_in_batches: Array<{
        id: string;
        sender: string;
        dest_address: string;
        erc20_token: { contract: string; amount: string };
        erc20_fee: { contract: string; amount: string };
      }>;
      unbatched_transfers: Array<{
        id: string;
        sender: string;
        dest_address: string;
        erc20_token: { contract: string; amount: string };
        erc20_fee: { contract: string; amount: string };
      }>;
    }>(`/injective/peggy/v1/pending_send_to_eth/${senderAddress}`);

    const allTransfers = [
      ...response.data.transfers_in_batches,
      ...response.data.unbatched_transfers,
    ];

    return allTransfers.map((t) => ({
      id: t.id,
      sender: t.sender,
      destAddress: t.dest_address,
      erc20Token: t.erc20_token,
      erc20Fee: t.erc20_fee,
    }));
  }

  /**
   * Get the ERC20 token mapping for a denom
   */
  async getDenomToERC20(denom: string): Promise<{
    erc20: string;
    cosmosOriginated: boolean;
  } | null> {
    try {
      const response = await this.httpClient.get<{
        erc20: string;
        cosmos_originated: boolean;
      }>(`/injective/peggy/v1/cosmos_originated/denom_to_erc20`, {
        params: { denom },
      });

      return {
        erc20: response.data.erc20,
        cosmosOriginated: response.data.cosmos_originated,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get the denom mapping for an ERC20 token
   */
  async getERC20ToDenom(erc20Address: string): Promise<{
    denom: string;
    cosmosOriginated: boolean;
  } | null> {
    try {
      const response = await this.httpClient.get<{
        denom: string;
        cosmos_originated: boolean;
      }>(`/injective/peggy/v1/cosmos_originated/erc20_to_denom`, {
        params: { erc20: erc20Address },
      });

      return {
        denom: response.data.denom,
        cosmosOriginated: response.data.cosmos_originated,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get bridge status
   */
  async getBridgeStatus(): Promise<{
    isActive: boolean;
    lastObservedNonce: string;
    lastBatchNonce: string;
    bridgeHeight: string;
  }> {
    // Query multiple endpoints to determine bridge status
    const [params, eventNonce] = await Promise.all([
      this.getParams(),
      this.httpClient.get<{ event_nonce: string }>(
        '/injective/peggy/v1/oracle/event_nonce'
      ).then((r) => r.data.event_nonce).catch(() => '0'),
    ]);

    return {
      isActive: true, // If we can query, the bridge is active
      lastObservedNonce: eventNonce,
      lastBatchNonce: '0', // Would need additional query
      bridgeHeight: params.bridgeContractStartHeight,
    };
  }

  /**
   * Get the Peggy contract address for the current network
   */
  getPeggyContractAddress(): string {
    const contracts = PEGGY_CONTRACTS[this.networkName as keyof typeof PEGGY_CONTRACTS];
    return contracts?.peggyContract || '';
  }

  /**
   * Get the INJ token contract address on Ethereum
   */
  getInjTokenContractAddress(): string {
    const contracts = PEGGY_CONTRACTS[this.networkName as keyof typeof PEGGY_CONTRACTS];
    return contracts?.injTokenContract || '';
  }
}

/**
 * Create a Peggy client from n8n credentials
 */
export async function createPeggyClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialName: string = 'injectiveNetwork'
): Promise<PeggyClient> {
  const credentials = await context.getCredentials(credentialName);

  const config: PeggyClientConfig = {
    network: credentials.network as string,
    restEndpoint: credentials.restEndpoint as string | undefined,
  };

  return new PeggyClient(config);
}
