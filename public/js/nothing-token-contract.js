/**
 * Nothing Token ($NTH) Contract Interface
 * Provides the ABI and functions to interact with the Nothing Token on Avalanche
 */

// Nothing Token ABI (Application Binary Interface)
const NothingTokenABI = [
  // ERC-20 Standard functions
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "sender", "type": "address"},
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Custom Nothing Token functions
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "sell",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buy",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "registerUser",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "isRegistered",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalUsers",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getTokensBurned",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getLastActivity",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Nothing Token Contract
class NothingToken {
  constructor() {
    // Contract addresses for each network
    this.contractAddresses = {
      // Mainnet contract address
      mainnet: '0x0987654321098765432109876543210987654321',
      // Fuji Testnet contract address
      fuji: '0x1234567890123456789012345678901234567890',
      // Current selected network
      current: null
    };
    
    // Default to mainnet address until we detect the connected network
    this.contractAddress = this.contractAddresses.mainnet;
    this.contract = null;
    this.decimals = 18; // Standard ERC-20 decimals
    this.symbol = 'NTH';
    this.name = 'Nothing Token';
    // Use our local logo file for the wallet display
    const baseUrl = window.location.origin;
    this.logoURI = `${baseUrl}/public/images/nth-logo.svg`;
    
    // Avascan links for verifying the token
    this.avascanLinks = {
      mainnet: `https://avascan.info/blockchain/c/token/${this.contractAddresses.mainnet}`,
      fuji: `https://testnet.avascan.info/blockchain/c/token/${this.contractAddresses.fuji}`
    };
  }

  /**
   * Initialize the contract with web3 instance
   */
  async init(web3) {
    if (!web3) {
      throw new Error('Web3 instance required');
    }
    
    this.web3 = web3;
    
    // Detect which network we're connected to
    try {
      const chainId = await web3.eth.getChainId();
      
      // Set the correct contract address based on the detected network
      if (chainId === 43114) {
        // Avalanche Mainnet
        this.contractAddress = this.contractAddresses.mainnet;
        this.contractAddresses.current = 'mainnet';
        console.log('Connected to Avalanche Mainnet, using mainnet contract');
      } else if (chainId === 43113) {
        // Avalanche Fuji Testnet
        this.contractAddress = this.contractAddresses.fuji;
        this.contractAddresses.current = 'fuji';
        console.log('Connected to Avalanche Fuji Testnet, using testnet contract');
      } else {
        // Default to mainnet if unknown network
        console.log(`Connected to unknown network (chainId: ${chainId}), defaulting to mainnet contract`);
      }
    } catch (error) {
      console.warn('Error detecting network, defaulting to mainnet contract:', error);
    }
    
    // Initialize contract with the correct address
    this.contract = new web3.eth.Contract(NothingTokenABI, this.contractAddress);
    
    // If available, try to get actual token details from the contract
    await this._loadTokenDetails();
    
    return this.contract;
  }
  
  /**
   * Register the Nothing Token with the wallet
   * This makes the token visible in Core wallet
   */
  async registerTokenWithWallet(userAddress) {
    if (!window.ethereum && !window.avalanche) {
      console.error('No wallet provider available');
      return false;
    }
    
    try {
      // Choose the appropriate provider (Core wallet or other)
      const provider = window.avalanche || window.ethereum;
      
      // Ensure we're using the right contract address for the current network
      const chainId = await this.web3.eth.getChainId();
      let contractAddress = this.contractAddress;
      let networkName = "Mainnet";
      
      // Update contract address based on detected network
      if (chainId === 43113) {
        contractAddress = this.contractAddresses.fuji;
        networkName = "Fuji Testnet";
      } else if (chainId === 43114) {
        contractAddress = this.contractAddresses.mainnet;
        networkName = "Mainnet";
      }
      
      console.log(`Adding NTH token to wallet on Avalanche ${networkName}`);
      console.log(`Token contract address: ${contractAddress}`);
      
      // Use wallet_watchAsset method to add the token
      await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: contractAddress,
            symbol: this.symbol,
            decimals: this.decimals,
            image: this.logoURI
          }
        }
      });
      
      // Provide Avascan link for verification
      const avascanLink = chainId === 43113 ? this.avascanLinks.fuji : this.avascanLinks.mainnet;
      console.log(`Successfully registered NTH token with wallet. View on Avascan: ${avascanLink}`);
      
      return true;
    } catch (error) {
      console.error('Error registering token with wallet:', error);
      return false;
    }
  }
  
  /**
   * Load token details from the contract
   * @private
   */
  async _loadTokenDetails() {
    if (!this.contract) {
      return;
    }
    
    try {
      // Try to load actual token details from the contract
      const [symbol, name, decimals] = await Promise.all([
        this.contract.methods.symbol().call(),
        this.contract.methods.name().call(),
        this.contract.methods.decimals().call()
      ]);
      
      if (symbol) this.symbol = symbol;
      if (name) this.name = name;
      if (decimals) this.decimals = parseInt(decimals);
      
      console.log(`Loaded token details: ${this.name} (${this.symbol})`);
    } catch (error) {
      console.warn('Could not load token details from contract, using defaults:', error);
    }
  }

  /**
   * Get token balance for an address
   */
  async getBalance(address) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const balance = await this.contract.methods.balanceOf(address).call();
      const decimals = await this.contract.methods.decimals().call();
      return balance / Math.pow(10, decimals);
    } catch (error) {
      console.error('Error getting NTH token balance:', error);
      throw error;
    }
  }

  /**
   * Get current token price in AVAX
   */
  async getCurrentPrice() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const priceWei = await this.contract.methods.getCurrentPrice().call();
      return this.web3.utils.fromWei(priceWei, 'ether');
    } catch (error) {
      console.error('Error getting token price:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async registerUser(userAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const tx = await this.contract.methods.registerUser().send({
        from: userAddress,
      });
      return tx;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Check if user is registered
   */
  async isRegistered(userAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      return await this.contract.methods.isRegistered(userAddress).call();
    } catch (error) {
      console.error('Error checking user registration:', error);
      throw error;
    }
  }

  /**
   * Buy tokens with AVAX
   */
  async buyTokens(userAddress, avaxAmount) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const weiAmount = this.web3.utils.toWei(avaxAmount.toString(), 'ether');
      const tx = await this.contract.methods.buy().send({
        from: userAddress,
        value: weiAmount,
      });
      return tx;
    } catch (error) {
      console.error('Error buying tokens:', error);
      throw error;
    }
  }

  /**
   * Sell tokens for AVAX
   */
  async sellTokens(userAddress, tokenAmount) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const tokenWei = this.web3.utils.toWei(tokenAmount.toString(), 'ether');
      const tx = await this.contract.methods.sell(tokenWei).send({
        from: userAddress,
      });
      return tx;
    } catch (error) {
      console.error('Error selling tokens:', error);
      throw error;
    }
  }

  /**
   * Burn tokens
   */
  async burnTokens(userAddress, tokenAmount) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const tokenWei = this.web3.utils.toWei(tokenAmount.toString(), 'ether');
      const tx = await this.contract.methods.burn(tokenWei).send({
        from: userAddress,
      });
      return tx;
    } catch (error) {
      console.error('Error burning tokens:', error);
      throw error;
    }
  }

  /**
   * Get tokens burned by user
   */
  async getTokensBurned(userAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const burnedWei = await this.contract.methods.getTokensBurned(userAddress).call();
      return this.web3.utils.fromWei(burnedWei, 'ether');
    } catch (error) {
      console.error('Error getting tokens burned:', error);
      throw error;
    }
  }

  /**
   * Get total users count
   */
  async getTotalUsers() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      return await this.contract.methods.getTotalUsers().call();
    } catch (error) {
      console.error('Error getting total users:', error);
      throw error;
    }
  }

  /**
   * Get last activity timestamp
   */
  async getLastActivity(userAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const timestamp = await this.contract.methods.getLastActivity(userAddress).call();
      return new Date(timestamp * 1000); // Convert to JavaScript Date
    } catch (error) {
      console.error('Error getting last activity:', error);
      throw error;
    }
  }
}

// Create a global instance
window.nothingToken = new NothingToken();