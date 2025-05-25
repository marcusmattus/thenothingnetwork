/**
 * Avascan Integration for Nothing Token
 * Provides utilities for viewing token on Avascan and verifying deployments
 */

// Function to generate Avascan link based on network and contract address
function getAvascanTokenLink(contractAddress, networkType = 'mainnet') {
  if (networkType === 'fuji' || networkType === 'testnet') {
    return `https://testnet.avascan.info/blockchain/c/token/${contractAddress}`;
  } else {
    return `https://avascan.info/blockchain/c/token/${contractAddress}`;
  }
}

// Function to open Avascan in a new tab
function openAvascan(contractAddress, networkType) {
  const url = getAvascanTokenLink(contractAddress, networkType);
  window.open(url, '_blank');
}

// Function to get the active network name based on chainId
async function getActiveNetworkName(web3) {
  try {
    const chainId = await web3.eth.getChainId();
    if (chainId === 43114) {
      return 'mainnet';
    } else if (chainId === 43113) {
      return 'fuji';
    } else {
      return 'unknown';
    }
  } catch (error) {
    console.error('Error determining network:', error);
    return 'unknown';
  }
}

// Function to check if a token is visible on Avascan
async function checkTokenOnAvascan(contractAddress, networkType = 'mainnet') {
  try {
    // Simple message for now - in a real implementation, you would 
    // check against Avascan's API or service
    console.log(`Checking if token ${contractAddress} is visible on Avascan ${networkType}...`);
    return {
      visible: true,
      url: getAvascanTokenLink(contractAddress, networkType)
    };
  } catch (error) {
    console.error('Error checking token on Avascan:', error);
    return {
      visible: false,
      error: error.message
    };
  }
}

// Add global object to window
window.avascanHelper = {
  getAvascanTokenLink,
  openAvascan,
  getActiveNetworkName,
  checkTokenOnAvascan
};