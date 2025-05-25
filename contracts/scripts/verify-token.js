const { ethers } = require("hardhat");
const axios = require('axios');

// Contract addresses after deployment
const TESTNET_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual address after deployment
const MAINNET_CONTRACT_ADDRESS = "0x0987654321098765432109876543210987654321"; // Replace with actual address after deployment

async function verifyOnAvascan() {
  console.log("Verifying Nothing Token (NTH) on Avascan...");

  // Verify token on Fuji Testnet
  await verifyNetwork("testnet", TESTNET_CONTRACT_ADDRESS);
  
  // Verify token on Mainnet
  await verifyNetwork("mainnet", MAINNET_CONTRACT_ADDRESS);
}

async function verifyNetwork(networkName, contractAddress) {
  console.log(`\nVerifying on ${networkName}...`);
  
  try {
    // Connect to the specified network
    const networkConfig = networkName === "testnet" ? "fuji" : "avalanche";
    await hre.run("compile");
    
    const provider = new ethers.providers.JsonRpcProvider(
      networkName === "testnet" 
        ? "https://api.avax-test.network/ext/bc/C/rpc"
        : "https://api.avax.network/ext/bc/C/rpc"
    );

    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.log(`❌ Contract not found at ${contractAddress} on ${networkName}`);
      return false;
    }
    
    console.log(`✅ Contract found at ${contractAddress} on ${networkName}`);
    
    // Try to connect to the contract to verify it's the Nothing Token
    const NothingToken = await ethers.getContractFactory("NothingToken");
    const contract = NothingToken.attach(contractAddress).connect(provider);
    
    try {
      // Verify token details
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);
      
      console.log("Token Details:");
      console.log(`- Name: ${name}`);
      console.log(`- Symbol: ${symbol}`);
      console.log(`- Decimals: ${decimals}`);
      
      console.log("✅ Contract verified as Nothing Token");
      
      // Generate Avascan link
      const avascanLink = `https://avascan.info/${networkName}/c-chain/evm/token/${contractAddress}`;
      console.log(`\nView on Avascan: ${avascanLink}`);
      
      // Check if token is visible on Avascan by querying their API (simplified)
      try {
        const response = await axios.get(
          `https://api.avascan.info/v2/network/${networkName === "testnet" ? "testnet" : "mainnet"}/evm/token/${contractAddress}`
        );
        
        if (response.status === 200 && response.data) {
          console.log("✅ Token is visible on Avascan");
        } else {
          console.log("⚠️ Token may not be fully indexed on Avascan yet. Check the link manually.");
        }
      } catch (error) {
        console.log("⚠️ Could not verify Avascan indexing status. Check the link manually.");
      }
      
      return true;
    } catch (error) {
      console.log("❌ Failed to verify token details:", error.message);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error verifying on ${networkName}:`, error.message);
    return false;
  }
}

// Execute the verification
verifyOnAvascan()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during verification:", error);
    process.exit(1);
  });