/**
 * Crypto Exchange for The Nothing App
 * Handles buying NTH tokens with ETH and AVAX
 */

class CryptoExchange {
  constructor() {
    // Exchange settings
    this.supportedTokens = ['avax', 'eth'];
    this.exchangeRates = {
      avax: 20,   // 1 AVAX = 20 NTH
      eth: 250    // 1 ETH = 250 NTH
    };
    
    // Liquidity pools
    this.liquidityPools = {
      avax: {
        nth: 200000,
        avax: 10000
      },
      eth: {
        nth: 250000,
        eth: 1000
      }
    };
    
    // Fee settings
    this.feePercentage = 0.5; // 0.5% fee
    
    // Price impact thresholds
    this.impactThresholds = {
      low: 0.5,   // 0.5%
      medium: 2,  // 2%
      high: 5     // 5%
    };
    
    // Initialize event history
    this.swapHistory = [];
    
    console.log('Crypto Exchange initialized');
  }
  
  /**
   * Get current exchange rate for a token
   * @param {string} token Token symbol (avax or eth)
   * @returns {number} Current exchange rate
   */
  getCurrentRate(token) {
    if (!this.supportedTokens.includes(token.toLowerCase())) {
      throw new Error(`Unsupported token: ${token}`);
    }
    
    token = token.toLowerCase();
    
    // Calculate the current rate from liquidity pool
    const pool = this.liquidityPools[token];
    return pool.nth / pool.avax;
  }
  
  /**
   * Calculate buy price with slippage
   * @param {string} token Token to buy with (avax or eth)
   * @param {number} amount Amount of token to spend
   * @returns {Object} Buy details with price impact
   */
  calculateBuyPrice(token, amount) {
    if (!this.supportedTokens.includes(token.toLowerCase())) {
      throw new Error(`Unsupported token: ${token}`);
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    token = token.toLowerCase();
    
    // Get pool data
    const pool = this.liquidityPools[token];
    
    // Calculate using constant product formula (x * y = k)
    const k = pool.nth * pool[token];
    
    // Apply fee
    const amountWithFee = amount * (1 - this.feePercentage / 100);
    
    // Calculate new token reserve
    const newTokenReserve = pool[token] + amountWithFee;
    
    // Calculate new NTH reserve
    const newNthReserve = k / newTokenReserve;
    
    // Calculate NTH amount to receive
    const nthAmount = pool.nth - newNthReserve;
    
    // Calculate price impact
    const priceImpact = (amount / pool[token]) * 100;
    
    // Calculate effective rate
    const effectiveRate = nthAmount / amount;
    
    // Get impact level
    let impactLevel = 'low';
    if (priceImpact > this.impactThresholds.high) {
      impactLevel = 'high';
    } else if (priceImpact > this.impactThresholds.medium) {
      impactLevel = 'medium';
    }
    
    return {
      inputToken: token,
      inputAmount: amount,
      outputAmount: nthAmount,
      effectiveRate,
      priceImpact,
      impactLevel,
      fee: amount * (this.feePercentage / 100)
    };
  }
  
  /**
   * Execute buy transaction
   * @param {string} token Token to buy with (avax or eth)
   * @param {number} amount Amount of token to spend
   * @param {string} userAddress User's wallet address
   * @returns {Object} Transaction details
   */
  executeBuy(token, amount, userAddress) {
    if (!userAddress) {
      throw new Error('User address is required');
    }
    
    // Calculate buy price
    const buyDetails = this.calculateBuyPrice(token, amount);
    
    // Update liquidity pool
    const pool = this.liquidityPools[token];
    pool[token] += amount * (1 - this.feePercentage / 100);
    pool.nth -= buyDetails.outputAmount;
    
    // Record transaction
    const txn = {
      type: 'buy',
      user: userAddress,
      inputToken: token,
      inputAmount: amount,
      outputAmount: buyDetails.outputAmount,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).substring(2, 42)}`
    };
    
    this.swapHistory.push(txn);
    
    return txn;
  }
  
  /**
   * Calculate sell price with slippage
   * @param {string} token Token to receive (avax or eth)
   * @param {number} nthAmount Amount of NTH to sell
   * @returns {Object} Sell details with price impact
   */
  calculateSellPrice(token, nthAmount) {
    if (!this.supportedTokens.includes(token.toLowerCase())) {
      throw new Error(`Unsupported token: ${token}`);
    }
    
    if (nthAmount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    token = token.toLowerCase();
    
    // Get pool data
    const pool = this.liquidityPools[token];
    
    // Calculate using constant product formula (x * y = k)
    const k = pool.nth * pool[token];
    
    // Calculate new NTH reserve
    const newNthReserve = pool.nth + nthAmount;
    
    // Calculate new token reserve
    const newTokenReserve = k / newNthReserve;
    
    // Calculate token amount to receive
    const tokenAmount = pool[token] - newTokenReserve;
    
    // Apply fee
    const tokenAmountAfterFee = tokenAmount * (1 - this.feePercentage / 100);
    
    // Calculate price impact
    const priceImpact = (nthAmount / pool.nth) * 100;
    
    // Calculate effective rate
    const effectiveRate = nthAmount / tokenAmountAfterFee;
    
    // Get impact level
    let impactLevel = 'low';
    if (priceImpact > this.impactThresholds.high) {
      impactLevel = 'high';
    } else if (priceImpact > this.impactThresholds.medium) {
      impactLevel = 'medium';
    }
    
    return {
      inputAmount: nthAmount,
      outputToken: token,
      outputAmount: tokenAmountAfterFee,
      effectiveRate,
      priceImpact,
      impactLevel,
      fee: tokenAmount * (this.feePercentage / 100)
    };
  }
  
  /**
   * Execute sell transaction
   * @param {string} token Token to receive (avax or eth)
   * @param {number} nthAmount Amount of NTH to sell
   * @param {string} userAddress User's wallet address
   * @returns {Object} Transaction details
   */
  executeSell(token, nthAmount, userAddress) {
    if (!userAddress) {
      throw new Error('User address is required');
    }
    
    // Calculate sell price
    const sellDetails = this.calculateSellPrice(token, nthAmount);
    
    // Update liquidity pool
    const pool = this.liquidityPools[token];
    pool.nth += nthAmount;
    pool[token] -= sellDetails.outputAmount / (1 - this.feePercentage / 100);
    
    // Record transaction
    const txn = {
      type: 'sell',
      user: userAddress,
      inputAmount: nthAmount,
      outputToken: token,
      outputAmount: sellDetails.outputAmount,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).substring(2, 42)}`
    };
    
    this.swapHistory.push(txn);
    
    return txn;
  }
  
  /**
   * Add liquidity to a pool
   * @param {string} token Token to add (avax or eth)
   * @param {number} tokenAmount Amount of token to add
   * @param {number} nthAmount Amount of NTH to add
   * @param {string} userAddress User's wallet address
   * @returns {Object} Liquidity addition details
   */
  addLiquidity(token, tokenAmount, nthAmount, userAddress) {
    if (!this.supportedTokens.includes(token.toLowerCase())) {
      throw new Error(`Unsupported token: ${token}`);
    }
    
    if (tokenAmount <= 0 || nthAmount <= 0) {
      throw new Error('Amounts must be greater than 0');
    }
    
    token = token.toLowerCase();
    
    // Get pool data
    const pool = this.liquidityPools[token];
    
    // Check if ratio is correct
    const currentRatio = pool.nth / pool[token];
    const providedRatio = nthAmount / tokenAmount;
    
    let actualTokenAmount = tokenAmount;
    let actualNthAmount = nthAmount;
    
    // Adjust amounts to maintain pool ratio if needed
    if (Math.abs(providedRatio - currentRatio) / currentRatio > 0.01) {
      // More than 1% difference, adjust
      actualNthAmount = tokenAmount * currentRatio;
      console.log(`Adjusted NTH amount to ${actualNthAmount} to maintain pool ratio`);
    }
    
    // Update pool
    pool[token] += actualTokenAmount;
    pool.nth += actualNthAmount;
    
    return {
      token,
      tokenAmount: actualTokenAmount,
      nthAmount: actualNthAmount,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).substring(2, 42)}`
    };
  }
  
  /**
   * Get exchange stats
   * @returns {Object} Exchange statistics
   */
  getExchangeStats() {
    const stats = {
      supportedTokens: this.supportedTokens,
      liquidityPools: {},
      rates: {},
      totalLiquidity: 0, // In USD
      volume24h: 0
    };
    
    // Calculate stats for each pool
    for (const token of this.supportedTokens) {
      const pool = this.liquidityPools[token];
      stats.liquidityPools[token] = { ...pool };
      stats.rates[token] = this.getCurrentRate(token);
      
      // Estimate pool value in USD
      let poolValueUsd = 0;
      if (token === 'avax') {
        poolValueUsd = pool.avax * 30; // Assume 1 AVAX = $30
      } else if (token === 'eth') {
        poolValueUsd = pool.eth * 3000; // Assume 1 ETH = $3000
      }
      
      stats.totalLiquidity += poolValueUsd;
      
      // Calculate 24h volume
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const tokenVolume = this.swapHistory
        .filter(tx => tx.timestamp >= oneDayAgo && 
                     (tx.inputToken === token || tx.outputToken === token))
        .reduce((sum, tx) => {
          if (tx.inputToken === token) {
            return sum + tx.inputAmount;
          } else {
            return sum + tx.outputAmount;
          }
        }, 0);
      
      stats.volume24h += tokenVolume * (token === 'eth' ? 3000 : 30);
    }
    
    return stats;
  }
}

// Initialize and make available globally
window.cryptoExchange = new CryptoExchange();