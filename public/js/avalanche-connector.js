/**
 * Avalanche L1 Blockchain Connector
 * Provides connectivity to Avalanche networks and wallet integration
 * Based on https://build.avax.network/docs/avalanche-l1s
 */

class AvalancheConnector {
  constructor() {
    // Avalanche network configurations
    this.networks = {
      mainnet: {
        name: 'Avalanche Mainnet',
        chainId: '0xa86a',
        decimals: 18,
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        blockExplorerUrl: 'https://snowtrace.io',
        currencySymbol: 'AVAX'
      },
      fuji: {
        name: 'Avalanche Fuji Testnet',
        chainId: '0xa869',
        decimals: 18,
        rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
        blockExplorerUrl: 'https://testnet.snowtrace.io',
        currencySymbol: 'AVAX'
      },
      // Add L1 Chain creation by validator for custom L1 chains
      custom: {
        name: 'Custom Avalanche L1',
        chainId: '0xa867', // This would be different for each custom L1
        decimals: 18,
        rpcUrl: 'https://custom-l1-rpc-endpoint.com', // This would be custom for each L1
        blockExplorerUrl: 'https://custom-l1-explorer.com', // This would be custom for each L1
        currencySymbol: 'AVAX'
      }
    };

    this.currentNetwork = this.networks.mainnet;
    this.web3 = null;
    this.connectedWallet = null;
    this.isConnected = false;
    this.eventListeners = {};
  }

  /**
   * Initialize the Web3 provider
   * Supports Core Wallet for Avalanche and other EVM wallets
   */
  init() {
    // Check for Core wallet first (it may inject as window.avalanche or window.ethereum with isAvalanche flag)
    if (window.avalanche) {
      console.log('Core Wallet detected directly!');
      this.web3 = new Web3(window.avalanche);
      this.walletType = 'core';
      this.checkConnection();
      this.setupEventListeners();
      return true;
    } 
    // Also check for Core wallet injected as ethereum provider
    else if (window.ethereum && window.ethereum.isAvalanche) {
      console.log('Core Wallet detected via ethereum provider!');
      this.web3 = new Web3(window.ethereum);
      this.walletType = 'core';
      this.checkConnection();
      this.setupEventListeners();
      return true;
    }
    // Then check for standard Ethereum providers (MetaMask, etc)
    else if (window.ethereum) {
      console.log('Ethereum wallet detected');
      this.web3 = new Web3(window.ethereum);
      this.walletType = 'ethereum';
      this.checkConnection();
      this.setupEventListeners();
      return true;
    } 
    // Legacy web3 fallback
    else if (window.web3) {
      console.log('Legacy web3 detected');
      this.web3 = new Web3(window.web3.currentProvider);
      this.walletType = 'legacy';
      this.checkConnection();
      this.setupEventListeners();
      return true;
    } 
    // No wallet detected
    else {
      console.log('No Ethereum wallet detected. Please install Core Wallet (https://core.app/) or MetaMask.');
      this.walletType = null;
      return false;
    }
  }

  /**
   * Set up event listeners for wallet events
   */
  setupEventListeners() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Account changed:', accounts[0]);
        this.connectedWallet = accounts[0] || null;
        this.isConnected = !!accounts[0];
        this.triggerEvent('accountChanged', { account: accounts[0] });
      });

      window.ethereum.on('chainChanged', (chainId) => {
        console.log('Network changed:', chainId);
        window.location.reload(); // Reload the page on network change
      });

      window.ethereum.on('disconnect', () => {
        console.log('Wallet disconnected');
        this.connectedWallet = null;
        this.isConnected = false;
        this.triggerEvent('disconnect', {});
      });
    }
  }

  /**
   * Check if wallet is already connected
   */
  async checkConnection() {
    if (this.web3) {
      try {
        const accounts = await this.web3.eth.getAccounts();
        this.connectedWallet = accounts[0] || null;
        this.isConnected = !!accounts[0];
        
        if (this.isConnected) {
          const chainId = await this.web3.eth.getChainId();
          this.checkNetwork(chainId);
        }
        
        return this.isConnected;
      } catch (error) {
        console.error('Error checking connection:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Connect to the wallet (Core wallet for Avalanche L1 or other EVM wallets)
   */
  async connectWallet() {
    if (!this.web3) {
      if (!this.init()) {
        throw new Error('No wallet detected. Please install Core Wallet (https://core.app/) or MetaMask.');
      }
    }

    try {
      // Different connection methods based on wallet type
      if (this.walletType === 'core' && window.avalanche) {
        // Core Wallet connection for Avalanche
        await window.avalanche.request({ method: 'eth_requestAccounts' });
      } else if (this.walletType === 'ethereum' && window.ethereum) {
        // Standard Ethereum wallet connection (MetaMask, etc)
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } else if (this.walletType === 'legacy' && window.web3) {
        // Legacy web3 wallet connection
        await window.web3.currentProvider.enable();
      } else {
        throw new Error('Wallet provider not properly initialized');
      }
      
      // Get connected accounts
      const accounts = await this.web3.eth.getAccounts();
      this.connectedWallet = accounts[0];
      this.isConnected = !!this.connectedWallet;
      
      if (this.isConnected) {
        // Check if connected to Avalanche network
        const chainId = await this.web3.eth.getChainId();
        await this.checkNetwork(chainId);
        
        console.log('Successfully connected to wallet:', this.connectedWallet);
        console.log('Wallet type:', this.walletType);
        
        this.triggerEvent('connect', { 
          account: this.connectedWallet,
          walletType: this.walletType
        });
        
        return this.connectedWallet;
      } else {
        throw new Error('No accounts found after connecting');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    }
  }

  /**
   * Check if connected to Avalanche network and switch if needed
   * Supports both Core wallet and other EVM wallets
   */
  async checkNetwork(chainId) {
    const hexChainId = chainId.toString(16);
    const targetChainId = this.currentNetwork.chainId;
    
    // If already on the right network, no need to switch
    if (`0x${hexChainId}` === targetChainId) {
      console.log('Already connected to the correct Avalanche network');
      return true;
    }
    
    // Different network switching methods based on wallet type
    if (this.walletType === 'core' && window.avalanche) {
      // Core Wallet network switching
      try {
        await window.avalanche.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
        console.log('Successfully switched to Avalanche network in Core wallet');
        return true;
      } catch (switchError) {
        // This error code indicates that the chain has not been added to the wallet
        if (switchError.code === 4902) {
          try {
            await this.addAvalancheNetwork(window.avalanche);
            return true;
          } catch (addError) {
            console.error('Error adding Avalanche network to Core wallet:', addError);
            throw addError;
          }
        } else {
          console.error('Error switching to Avalanche network in Core wallet:', switchError);
          throw switchError;
        }
      }
    } else if (this.walletType === 'ethereum' && window.ethereum) {
      // Standard Ethereum wallet network switching (MetaMask, etc.)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
        console.log('Successfully switched to Avalanche network');
        return true;
      } catch (switchError) {
        // This error code indicates that the chain has not been added to the wallet
        if (switchError.code === 4902) {
          try {
            await this.addAvalancheNetwork(window.ethereum);
            return true;
          } catch (addError) {
            console.error('Error adding Avalanche network:', addError);
            throw addError;
          }
        } else {
          console.error('Error switching to Avalanche network:', switchError);
          throw switchError;
        }
      }
    } else {
      throw new Error('No compatible wallet provider found for network switching');
    }
  }

  /**
   * Add Avalanche network to wallet
   * @param {Object} provider - The wallet provider (window.avalanche or window.ethereum)
   */
  async addAvalancheNetwork(provider) {
    if (!provider) {
      throw new Error('Wallet provider is required to add network');
    }
    
    const network = this.currentNetwork;
    
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: network.chainId,
            chainName: network.name,
            nativeCurrency: {
              name: 'Avalanche',
              symbol: network.currencySymbol,
              decimals: network.decimals,
            },
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorerUrl],
          },
        ],
      });
      console.log(`Successfully added ${network.name} to wallet`);
      return true;
    } catch (error) {
      console.error(`Error adding ${network.name} to wallet:`, error);
      throw error;
    }
  }
  
  /**
   * Add a custom Avalanche L1 Chain to wallet
   * Useful for connecting to L1 chains created by validators
   * @param {Object} customChainConfig - Configuration for the custom L1 chain
   */
  async addCustomL1Chain(customChainConfig) {
    // Validate required fields
    const requiredFields = ['name', 'chainId', 'rpcUrl', 'currencySymbol'];
    for (const field of requiredFields) {
      if (!customChainConfig[field]) {
        throw new Error(`Missing required field for custom L1 chain: ${field}`);
      }
    }
    
    // Create a custom network configuration
    const customNetwork = {
      name: customChainConfig.name,
      chainId: customChainConfig.chainId.startsWith('0x') ? customChainConfig.chainId : `0x${customChainConfig.chainId}`,
      decimals: customChainConfig.decimals || 18,
      rpcUrl: customChainConfig.rpcUrl,
      blockExplorerUrl: customChainConfig.blockExplorerUrl || '',
      currencySymbol: customChainConfig.currencySymbol
    };
    
    // Store the custom network
    this.networks.custom = customNetwork;
    
    // Set as current network
    this.currentNetwork = customNetwork;
    
    // Add to wallet
    const provider = this.walletType === 'core' ? window.avalanche : 
                    this.walletType === 'ethereum' ? window.ethereum : null;
                    
    if (!provider) {
      throw new Error('No compatible wallet provider found for adding custom network');
    }
    
    return this.addAvalancheNetwork(provider);
  }

  /**
   * Switch between Mainnet and Testnet or Custom L1 chains
   * @param {string} networkType - 'mainnet', 'fuji', or 'custom'
   * @param {Object} customConfig - Configuration for custom L1 chain (optional)
   */
  async switchNetwork(networkType, customConfig = null) {
    // Validate network type
    if (!['mainnet', 'fuji', 'custom'].includes(networkType)) {
      throw new Error('Invalid network type. Use "mainnet", "fuji", or "custom".');
    }
    
    // If switching to custom network with config, update the custom network
    if (networkType === 'custom' && customConfig) {
      // Update the custom network configuration
      this.networks.custom = {
        name: customConfig.name || 'Custom Avalanche L1',
        chainId: customConfig.chainId.startsWith('0x') ? customConfig.chainId : `0x${customConfig.chainId}`,
        decimals: customConfig.decimals || 18,
        rpcUrl: customConfig.rpcUrl,
        blockExplorerUrl: customConfig.blockExplorerUrl || '',
        currencySymbol: customConfig.currencySymbol || 'AVAX'
      };
    }
    
    // Set the current network
    this.currentNetwork = this.networks[networkType];
    
    console.log(`Switching to network: ${this.currentNetwork.name}`);
    
    // If connected to wallet, attempt to switch the network
    if (this.isConnected) {
      try {
        const chainId = await this.web3.eth.getChainId();
        const result = await this.checkNetwork(chainId);
        
        // Dispatch network change event
        this.triggerEvent('networkChanged', {
          networkType: networkType,
          networkName: this.currentNetwork.name,
          chainId: this.currentNetwork.chainId
        });
        
        return result;
      } catch (error) {
        console.error('Error switching network:', error);
        throw error;
      }
    }
    
    return true;
  }

  /**
   * Get AVAX balance for an address
   */
  async getAVAXBalance(address) {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }
    
    try {
      const balance = await this.web3.eth.getBalance(address || this.connectedWallet);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Error getting AVAX balance:', error);
      throw error;
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(tokenAddress, address) {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }
    
    const minABI = [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
      },
      {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        type: "function",
      },
    ];
    
    try {
      const tokenContract = new this.web3.eth.Contract(minABI, tokenAddress);
      const balance = await tokenContract.methods.balanceOf(address || this.connectedWallet).call();
      const decimals = await tokenContract.methods.decimals().call();
      
      return balance / Math.pow(10, decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  /**
   * Send AVAX to an address
   */
  async sendAVAX(toAddress, amount) {
    if (!this.isConnected || !this.web3) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const weiAmount = this.web3.utils.toWei(amount.toString(), 'ether');
      
      const transaction = {
        from: this.connectedWallet,
        to: toAddress,
        value: weiAmount,
      };
      
      const txHash = await this.web3.eth.sendTransaction(transaction);
      return txHash;
    } catch (error) {
      console.error('Error sending AVAX:', error);
      throw error;
    }
  }

  /**
   * Execute a smart contract function
   */
  async executeContract(contractAddress, abi, functionName, params = [], value = '0') {
    if (!this.isConnected || !this.web3) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const contract = new this.web3.eth.Contract(abi, contractAddress);
      const method = contract.methods[functionName](...params);
      
      const tx = {
        from: this.connectedWallet,
        to: contractAddress,
        data: method.encodeABI(),
        value: this.web3.utils.toWei(value, 'ether'),
      };
      
      const gasEstimate = await method.estimateGas(tx);
      tx.gas = Math.floor(gasEstimate * 1.2); // Add 20% buffer
      
      const txHash = await this.web3.eth.sendTransaction(tx);
      return txHash;
    } catch (error) {
      console.error(`Error executing contract function ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash) {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }
    
    try {
      const tx = await this.web3.eth.getTransaction(txHash);
      return tx;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  /**
   * Event handling
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  triggerEvent(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        setTimeout(() => callback(data), 0);
      });
    }
  }
}

// Create a global instance
window.avalancheConnector = new AvalancheConnector();