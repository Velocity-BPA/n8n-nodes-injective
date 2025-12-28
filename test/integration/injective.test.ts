/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Integration Tests for Injective Node
 *
 * These tests require network access to Injective testnet.
 * Set environment variable INJECTIVE_TEST_ADDRESS to run tests.
 */

import { InjectiveClient } from '../../nodes/Injective/transport/injectiveClient';
import { ExchangeClient } from '../../nodes/Injective/transport/exchangeClient';
import { NETWORKS } from '../../nodes/Injective/constants/networks';

// Skip integration tests if no test address is provided
const TEST_ADDRESS = process.env.INJECTIVE_TEST_ADDRESS || '';
const RUN_INTEGRATION = TEST_ADDRESS.startsWith('inj1');

describe('Injective Client Integration', () => {
  let client: InjectiveClient;

  beforeAll(() => {
    client = new InjectiveClient({ network: 'testnet' });
  });

  describe('Node Info', () => {
    it('should get node info', async () => {
      if (!RUN_INTEGRATION) {
        console.log('Skipping integration test - no test address provided');
        return;
      }

      const nodeInfo = await client.getNodeInfo();
      expect(nodeInfo.nodeInfo.network).toBeDefined();
      expect(nodeInfo.syncInfo.latestBlockHeight).toBeDefined();
    }, 30000);
  });

  describe('Account Queries', () => {
    it('should get account info', async () => {
      if (!RUN_INTEGRATION) return;

      const account = await client.getAccount(TEST_ADDRESS);
      expect(account.address).toBe(TEST_ADDRESS);
      expect(account.accountNumber).toBeDefined();
    }, 30000);

    it('should get all balances', async () => {
      if (!RUN_INTEGRATION) return;

      const balances = await client.getAllBalances(TEST_ADDRESS);
      expect(Array.isArray(balances)).toBe(true);
    }, 30000);
  });

  describe('Staking Queries', () => {
    it('should get validators', async () => {
      if (!RUN_INTEGRATION) return;

      const validators = await client.getValidators('BOND_STATUS_BONDED');
      expect(Array.isArray(validators)).toBe(true);
      if (validators.length > 0) {
        expect(validators[0].operatorAddress).toBeDefined();
        expect(validators[0].moniker).toBeDefined();
      }
    }, 30000);
  });
});

describe('Exchange Client Integration', () => {
  let client: ExchangeClient;

  beforeAll(() => {
    client = new ExchangeClient({ network: 'testnet' });
  });

  describe('Market Queries', () => {
    it('should get spot markets', async () => {
      if (!RUN_INTEGRATION) return;

      const markets = await client.getSpotMarkets();
      expect(Array.isArray(markets)).toBe(true);
    }, 30000);

    it('should get derivative markets', async () => {
      if (!RUN_INTEGRATION) return;

      const markets = await client.getDerivativeMarkets();
      expect(Array.isArray(markets)).toBe(true);
    }, 30000);
  });

  describe('Oracle Queries', () => {
    it('should get oracle prices', async () => {
      if (!RUN_INTEGRATION) return;

      const prices = await client.getOraclePrices();
      expect(Array.isArray(prices)).toBe(true);
    }, 30000);
  });
});

describe('Network Configuration', () => {
  it('should have valid mainnet configuration', () => {
    expect(NETWORKS.mainnet).toBeDefined();
    expect(NETWORKS.mainnet.chainId).toBe('injective-1');
    expect(NETWORKS.mainnet.restEndpoint).toContain('injective.network');
  });

  it('should have valid testnet configuration', () => {
    expect(NETWORKS.testnet).toBeDefined();
    expect(NETWORKS.testnet.chainId).toBe('injective-888');
  });
});
