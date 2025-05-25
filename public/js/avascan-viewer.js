/**
 * Avascan Viewer Functions
 * Enables viewing the Nothing Token on Avascan for both testnet and mainnet
 */

// Function to view the Nothing Token on Avascan
function viewOnAvascan(networkType) {
  if (!window.nothingToken) {
    showTokenMessage('Token contract not initialized', true);
    return;
  }
  
  try {
    // Get the appropriate contract address based on network
    const contractAddress = networkType === 'fuji' 
      ? window.nothingToken.contractAddresses.fuji 
      : window.nothingToken.contractAddresses.mainnet;
    
    // Generate Avascan URL
    const networkName = networkType === 'fuji' ? 'testnet' : 'mainnet';
    const avascanUrl = `https://${networkName === 'testnet' ? 'testnet.' : ''}avascan.info/blockchain/c/token/${contractAddress}`;
    
    // Show message
    showTokenMessage(`Opening ${networkName === 'testnet' ? 'Fuji Testnet' : 'Mainnet'} token on Avascan`);
    
    // Open in new tab
    window.open(avascanUrl, '_blank');
  } catch (error) {
    console.error('Error opening Avascan:', error);
    showTokenMessage('Error opening Avascan. Please try again.', true);
  }
}

// Function to update network info display
function updateNetworkInfo() {
  if (!window.avalancheConnector || !window.avalancheConnector.isConnected) {
    return;
  }
  
  try {
    // Get current network from connector
    const networkType = window.avalancheConnector.currentNetwork.name;
    const networkNameElement = document.getElementById('network-name');
    
    if (networkNameElement) {
      networkNameElement.textContent = networkType;
    }
    
    // Update token contract address based on current network
    if (window.nothingToken) {
      const isMainnet = networkType.toLowerCase().includes('mainnet');
      const networkKey = isMainnet ? 'mainnet' : 'fuji';
      
      // Update contract address
      window.nothingToken.contractAddress = window.nothingToken.contractAddresses[networkKey];
      window.nothingToken.contractAddresses.current = networkKey;
      
      console.log(`Token contract address updated for ${networkType}: ${window.nothingToken.contractAddress}`);
    }
  } catch (error) {
    console.error('Error updating network info:', error);
  }
}

// Event listener for network changes
document.addEventListener('DOMContentLoaded', () => {
  if (window.avalancheConnector) {
    window.avalancheConnector.on('networkChanged', (data) => {
      updateNetworkInfo();
    });
  }
});