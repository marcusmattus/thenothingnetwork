const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Nothing Token (NTH) to Avalanche...");

  // Get the contract factory
  const NothingToken = await ethers.getContractFactory("NothingToken");
  
  // Deploy the contract
  const nothingToken = await NothingToken.deploy();
  await nothingToken.deployed();
  
  console.log("Nothing Token (NTH) deployed to:", nothingToken.address);
  console.log("Transaction hash:", nothingToken.deployTransaction.hash);
  
  // Wait for 5 block confirmations
  console.log("Waiting for block confirmations...");
  await nothingToken.deployTransaction.wait(5);
  
  console.log("Deployment confirmed!");
  console.log("----------------------------------------------------");
  console.log("Contract Address:", nothingToken.address);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("Block Number:", await ethers.provider.getBlockNumber());
  console.log("----------------------------------------------------");
  console.log("View on Avascan:", getAvascanLink(nothingToken.address, (await ethers.provider.getNetwork()).chainId));
}

function getAvascanLink(address, chainId) {
  // Determine if we're on testnet or mainnet
  const network = chainId === 43113 ? "testnet" : "mainnet";
  return `https://avascan.info/${network}/c-chain/evm/token/${address}`;
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });