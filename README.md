# n8n-nodes-injective

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for the Injective blockchain - the fastest layer 1 blockchain built for DeFi. This node provides 24 resources and 200+ operations for spot/derivative trading, staking, governance, cross-chain operations, and real-time WebSocket streaming.

![n8n](https://img.shields.io/badge/n8n-community--node-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)

## Features

- **Account Management**: Query balances, subaccounts, and portfolio data
- **Spot Trading**: Place and manage orders on spot markets
- **Derivative Trading**: Trade perpetuals with up to 20x leverage
- **Position Management**: Monitor and manage derivative positions
- **Staking**: Delegate INJ to validators and claim rewards
- **Governance**: Vote on proposals and participate in DAO
- **Cross-Chain**: IBC transfers to 50+ Cosmos chains
- **Ethereum Bridge**: Peggy bridge for ETH<->INJ transfers
- **Oracle Prices**: Band, Pyth, and Chainlink price feeds
- **CosmWasm**: Deploy and interact with smart contracts
- **Token Factory**: Create native tokens on Injective
- **Real-Time Streaming**: WebSocket triggers for live updates
- **Insurance Fund**: Participate in market insurance
- **Auctions**: Participate in INJ burn auctions

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes** in n8n
2. Click **Install**
3. Enter `n8n-nodes-injective`
4. Click **Install**

### Manual Installation

```bash
# In your n8n installation directory
npm install n8n-nodes-injective
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-injective.git
cd n8n-nodes-injective

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom directory
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-injective

# Restart n8n
n8n start
```

## Credentials Setup

### Injective Network Credentials

| Field | Description | Example |
|-------|-------------|---------|
| Network | Select network | Mainnet, Testnet, Devnet, Custom |
| Authentication | Auth method | Mnemonic, Private Key, Read Only |
| Mnemonic | 24-word phrase | `word1 word2 ... word24` |
| Private Key | Hex private key | `0x...` |
| Derivation Path | BIP44 path | `m/44'/60'/0'/0/0` |

### Injective API Credentials

| Field | Description | Example |
|-------|-------------|---------|
| Environment | API environment | Mainnet, Testnet, Custom |
| API Key | Optional API key | For rate limit increases |

### Injective EVM Credentials

| Field | Description | Example |
|-------|-------------|---------|
| Network | EVM network | Mainnet, Testnet, Custom |
| Private Key | ETH private key | `0x...` |

## Resources & Operations

### Account
- Get Account Info
- Get INJ Balance
- Get All Balances
- Get Subaccounts
- Get Subaccount Balances
- Get Portfolio
- Validate Address

### Bank
- Get Balance
- Get All Balances
- Get Total Supply
- Get Spendable Balances
- Send INJ (coming soon)
- Send Token (coming soon)

### Exchange
- Get Spot Markets
- Get Derivative Markets
- Get Market Info
- Get Orderbook
- Get Trades
- Get Funding Rate
- Get Oracle Price

### Spot Order
- Place Limit Order
- Place Market Order
- Cancel Order
- Cancel All Orders
- Get Order
- Get Open Orders
- Get Order History

### Derivative Order
- Place Limit Order
- Place Market Order
- Place Stop Order
- Cancel Order
- Get Order
- Get Open Orders
- Get Positions

### Staking
- Get Validators
- Get Active Validators
- Get Delegations
- Get Staking Rewards
- Delegate INJ (coming soon)
- Claim Rewards (coming soon)

### And Many More...
- Governance (proposals, voting)
- IBC (cross-chain transfers)
- Peggy (Ethereum bridge)
- Oracle (price feeds)
- WASM (smart contracts)
- Token Factory (create tokens)
- Insurance Fund
- Auctions
- Analytics
- Streaming

## Trigger Node

The Injective Trigger node provides real-time event monitoring:

| Event | Description |
|-------|-------------|
| Balance Changed | Account balance updates |
| Order Placed | New order created |
| Order Filled | Order execution |
| Order Cancelled | Order cancellation |
| Position Changed | Position updates |
| Position Liquidated | Liquidation events |
| Trade Executed | Market trades |
| Price Alert | Price threshold triggers |
| New Block | Block production |

## Usage Examples

### Get Account Balance

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "account",
        "operation": "getInjBalance",
        "address": "inj1..."
      },
      "name": "Get INJ Balance",
      "type": "n8n-nodes-injective.injective"
    }
  ]
}
```

### Query Spot Markets

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "exchange",
        "operation": "getSpotMarkets",
        "marketStatus": "active"
      },
      "name": "Get Spot Markets",
      "type": "n8n-nodes-injective.injective"
    }
  ]
}
```

### Monitor Trades

```json
{
  "nodes": [
    {
      "parameters": {
        "event": "tradeExecuted",
        "marketId": "0x..."
      },
      "name": "Trade Monitor",
      "type": "n8n-nodes-injective.injectiveTrigger"
    }
  ]
}
```

## Injective Concepts

### INJ Token
INJ is the native token of Injective, used for:
- Transaction fees (gas)
- Staking and governance
- Fee discounts on trading
- Insurance fund participation

### Subaccounts
Injective uses isolated subaccounts for trading, allowing:
- Separate margin per subaccount
- Risk isolation
- Portfolio management

### Spot vs Derivative Markets
- **Spot**: Direct token exchange (INJ/USDT)
- **Derivative**: Perpetual futures with leverage

### Funding Rate
Perpetual futures have a funding rate to anchor price to spot:
- Positive: Longs pay shorts
- Negative: Shorts pay longs

### Peggy Bridge
Trustless bridge between Ethereum and Injective:
- Deposit ERC-20 tokens from Ethereum
- Withdraw tokens to Ethereum

### IBC
Inter-Blockchain Communication for:
- Transfer to 50+ Cosmos chains
- Cross-chain message passing

## Networks

| Network | Chain ID | Description |
|---------|----------|-------------|
| Mainnet | injective-1 | Production network |
| Testnet | injective-888 | Test environment |
| Devnet | injective-777 | Development |

## Error Handling

The node provides detailed error messages for common issues:

- **Invalid Address**: Check address format (starts with `inj1`)
- **Insufficient Balance**: Ensure adequate funds
- **Market Not Found**: Verify market ID
- **Order Rejected**: Check price/quantity parameters
- **Rate Limited**: Reduce request frequency

## Security Best Practices

1. **Never share mnemonics or private keys**
2. **Use testnet for development**
3. **Start with small amounts**
4. **Validate addresses before transfers**
5. **Set appropriate leverage limits**
6. **Monitor positions for liquidation risk**
7. **Use stop-loss orders**

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Fix lint issues
npm run lint:fix
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

All contributions are licensed under BSL 1.1.

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-injective/issues)
- **Documentation**: [Injective Docs](https://docs.injective.network/)
- **Discord**: [Injective Discord](https://discord.gg/injective)

## Acknowledgments

- [Injective Labs](https://injective.com/) for the blockchain and SDK
- [n8n](https://n8n.io/) for the automation platform
- [Cosmos SDK](https://cosmos.network/) for the underlying framework
