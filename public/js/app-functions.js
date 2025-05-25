/**
 * The Nothing App - Avalanche L1 Functions
 * Functions for handling Core wallet integration and token management
 */

// Function to add NTH token to user's wallet (Core wallet or MetaMask)
async function addTokenToWallet() {
  if (!state.currentUser || !window.avalancheConnector.isConnected) {
    showTokenMessage('Please connect your wallet first', true);
    return;
  }
  
  try {
    // Use the registerTokenWithWallet method we implemented
    const result = await window.nothingToken.registerTokenWithWallet(state.currentUser.address);
    
    if (result) {
      showTokenMessage('Successfully added NTH token to your wallet!');
    } else {
      showTokenMessage('Failed to add token to wallet. Please try again.', true);
    }
  } catch (error) {
    console.error('Error adding token to wallet:', error);
    showTokenMessage('Error adding token to wallet. Make sure your wallet is connected.', true);
  }
}

// Function to handle network changes
async function handleNetworkChange(networkType) {
  if (!state.currentUser || !window.avalancheConnector.isConnected) {
    showTokenMessage('Please connect your wallet first', true);
    return;
  }
  
  // If custom network is selected, show the modal
  if (networkType === 'custom') {
    showCustomNetworkModal();
    return;
  }
  
  try {
    showTokenMessage(`Switching to ${networkType === 'mainnet' ? 'Avalanche Mainnet' : 'Avalanche Fuji Testnet'}...`);
    
    // Use the switchNetwork method from our connector
    await window.avalancheConnector.switchNetwork(networkType);
    
    // Update UI
    showTokenMessage(`Connected to ${networkType === 'mainnet' ? 'Avalanche Mainnet' : 'Avalanche Fuji Testnet'}`);
  } catch (error) {
    console.error('Error switching network:', error);
    showTokenMessage('Failed to switch network. Please try again.', true);
  }
}

// Function to show custom network modal
function showCustomNetworkModal() {
  // Create modal if it doesn't exist
  let modal = document.getElementById('custom-network-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-network-modal';
    modal.className = 'modal';
    
    const modalContent = `
      <div class="modal-content">
        <span class="close-modal" onclick="hideCustomNetworkModal()">&times;</span>
        <h2>Add Custom L1 Chain</h2>
        <div class="form-group">
          <label for="custom-network-name">Chain Name</label>
          <input type="text" id="custom-network-name" placeholder="My Custom L1">
        </div>
        <div class="form-group">
          <label for="custom-network-chain-id">Chain ID (hex)</label>
          <input type="text" id="custom-network-chain-id" placeholder="0xa867">
        </div>
        <div class="form-group">
          <label for="custom-network-rpc">RPC URL</label>
          <input type="text" id="custom-network-rpc" placeholder="https://mycustom-l1-rpc.com">
        </div>
        <div class="form-group">
          <label for="custom-network-explorer">Block Explorer (optional)</label>
          <input type="text" id="custom-network-explorer" placeholder="https://mycustom-explorer.com">
        </div>
        <button onclick="addCustomNetwork()" class="modal-button">Add Network</button>
      </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Add modal styles if not already present
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.7);
      }
      
      .modal-content {
        background-color: var(--color-card-background);
        margin: 15% auto;
        padding: 20px;
        border: 1px solid var(--color-connection);
        border-radius: var(--border-radius-md);
        width: 80%;
        max-width: 500px;
      }
      
      .close-modal {
        color: var(--color-text-secondary);
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
      }
      
      .close-modal:hover {
        color: var(--color-text);
      }
      
      .modal-button {
        background-color: var(--color-accent);
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: var(--border-radius-sm);
        cursor: pointer;
        margin-top: 10px;
      }
      
      .modal-button:hover {
        background-color: var(--color-accent-dark);
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  // Show the modal
  modal.style.display = 'block';
}

// Function to hide custom network modal
function hideCustomNetworkModal() {
  const modal = document.getElementById('custom-network-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Function to add custom L1 network
async function addCustomNetwork() {
  const name = document.getElementById('custom-network-name').value;
  const chainId = document.getElementById('custom-network-chain-id').value;
  const rpcUrl = document.getElementById('custom-network-rpc').value;
  const blockExplorerUrl = document.getElementById('custom-network-explorer').value || '';
  
  if (!name || !chainId || !rpcUrl) {
    showTokenMessage('Please fill in all required fields', true);
    return;
  }
  
  try {
    showTokenMessage(`Adding custom network: ${name}...`);
    
    // Use our customized method to add the custom L1 chain
    await window.avalancheConnector.addCustomL1Chain({
      name,
      chainId,
      rpcUrl,
      blockExplorerUrl,
      currencySymbol: 'AVAX'
    });
    
    // Update UI
    hideCustomNetworkModal();
    showTokenMessage(`Successfully connected to ${name}`);
  } catch (error) {
    console.error('Error adding custom network:', error);
    showTokenMessage('Failed to add custom network. Please check your inputs and try again.', true);
  }
}

// Function to detect wallet type
function detectWalletType() {
  if (window.avalanche) {
    return 'Core Wallet (direct)';
  } else if (window.ethereum && window.ethereum.isAvalanche) {
    return 'Core Wallet';
  } else if (window.ethereum && window.ethereum.isMetaMask) {
    return 'MetaMask';
  } else if (window.ethereum) {
    return 'Ethereum Wallet';
  } else {
    return 'No wallet detected';
  }
}

// Handle special events for Core wallet
function setupCoreWalletListeners() {
  // Listen for network changes
  if (window.avalancheConnector) {
    window.avalancheConnector.on('networkChanged', (data) => {
      console.log('Network changed:', data);
      showTokenMessage(`Network changed to ${data.networkName}`);
      
      // Update network selector if available
      const networkSelect = document.getElementById('network-select');
      if (networkSelect) {
        networkSelect.value = data.networkType;
      }
    });
  }
}