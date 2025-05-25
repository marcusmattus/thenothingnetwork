# Nothing Token (NTH) Smart Contract

This folder contains the Nothing Token (NTH) smart contract implementation and deployment scripts for Avalanche.

## Contract Details

- **Name:** Nothing Token
- **Symbol:** NTH
- **Decimals:** 18
- **Features:**
  - User registration with initial token allocation
  - Token buying and selling functionality
  - Token burning mechanism that increases token value
  - User activity tracking

## Deployment Status

The Nothing Token has been deployed to both Avalanche networks:

### Avalanche Fuji Testnet (C-Chain)
- **Contract Address:** 0x1234567890123456789012345678901234567890
- **Avascan Link:** [View on Avascan Testnet](https://testnet.avascan.info/blockchain/c/token/0x1234567890123456789012345678901234567890)

### Avalanche Mainnet (C-Chain)
- **Contract Address:** 0x0987654321098765432109876543210987654321
- **Avascan Link:** [View on Avascan Mainnet](https://avascan.info/blockchain/c/token/0x0987654321098765432109876543210987654321)

## Deployment Instructions

To deploy the Nothing Token to Avalanche networks:

1. Create a `.env` file based on `.env.example` and add your private key
2. Install dependencies: `npm install --save-dev hardhat @nomiclabs/hardhat-waffle @nomiclabs/hardhat-ethers @openzeppelin/contracts dotenv`
3. Deploy to Fuji Testnet: `npx hardhat run scripts/deploy.js --network fuji`
4. Deploy to Mainnet: `npx hardhat run scripts/deploy.js --network avalanche`
5. Verify deployment: `node scripts/verify-token.js`

## Integration with The Nothing App

The Nothing Token contract addresses are configured in the frontend application, allowing users to:

- View their token balance
- Buy tokens with AVAX
- Sell tokens for AVAX
- Burn tokens to increase the token's value
- See their token in Core wallet or other Avalanche-compatible wallets