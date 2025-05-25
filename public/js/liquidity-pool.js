/**
 * Liquidity Pool Management for The Nothing App
 * Handles liquidity pool operations, swapping, and price impact calculations
 */

class LiquidityPool {
  constructor() {
    // Pool reserves
    this.reserves = {
      nth: 100000, // Initial NTH token reserve
      avax: 5000   // Initial AVAX reserve
    };
    
    // Pool parameters
    this.fee = 0.003; // 0.3% swap fee
    this.slippageTolerance = 0.01; // 1% default slippage tolerance
    
    // Price impact thresholds
    this.lowImpactThreshold = 0.01; // 1%
    this.highImpactThreshold = 0.05; // 5%
    
    // Liquidity providers
    this.liquidityProviders = new Map();
    
    // Historical data
    this.priceHistory = [];
    this.volumeHistory = {
      daily: 0,
      weekly: 0,
      monthly: 0
    };
    
    // Initialize with some sample price history
    this.initializePriceHistory();
    
    console.log('Liquidity pool initialized with', this.reserves.nth, 'NTH and', this.reserves.avax, 'AVAX');
  }
  
  /**
   * Initialize price history with some sample data
   */
  initializePriceHistory() {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Generate last 30 days of price history
    for (let i = 30; i >= 0; i--) {
      const timestamp = now - (i * dayInMs);
      const basePrice = this.getCurrentPrice();
      
      // Add some randomness to prices
      const variance = 0.1; // 10% max variance
      const randomFactor = 1 + (Math.random() * variance * 2 - variance);
      
      this.priceHistory.push({
        timestamp,
        price: basePrice * randomFactor
      });
    }
  }
  
  /**
   * Get current token price (AVAX per NTH)
   * @returns {number} Current price
   */
  getCurrentPrice() {
    return this.reserves.avax / this.reserves.nth;
  }
  
  /**
   * Calculate amount of tokens to receive for a given input
   * @param {string} inputToken Token being provided (nth or avax)
   * @param {number} inputAmount Amount of input token
   * @returns {Object} Output data including amount, price impact, and minimum received
   */
  getSwapOutput(inputToken, inputAmount) {
    if (inputAmount <= 0) {
      throw new Error('Input amount must be greater than 0');
    }
    
    const outputToken = inputToken === 'nth' ? 'avax' : 'nth';
    
    // Calculate output amount using constant product formula: x * y = k
    const inputReserve = this.reserves[inputToken];
    const outputReserve = this.reserves[outputToken];
    
    // Apply swap fee
    const inputAmountWithFee = inputAmount * (1 - this.fee);
    
    // Calculate output amount
    const numerator = inputAmountWithFee * outputReserve;
    const denominator = inputReserve + inputAmountWithFee;
    const outputAmount = numerator / denominator;
    
    // Calculate price impact
    const priceImpact = inputAmount / (inputReserve + inputAmount);
    
    // Calculate minimum amount received with slippage tolerance
    const minimumReceived = outputAmount * (1 - this.slippageTolerance);
    
    return {
      outputAmount,
      priceImpact,
      minimumReceived,
      fee: inputAmount * this.fee
    };
  }
  
  /**
   * Execute a swap
   * @param {string} inputToken Token being provided (nth or avax)
   * @param {number} inputAmount Amount of input token
   * @param {string} userAddress User's address
   * @returns {Object} Swap result
   */
  executeSwap(inputToken, inputAmount, userAddress) {
    if (!userAddress) {
      throw new Error('User address is required');
    }
    
    const swapData = this.getSwapOutput(inputToken, inputAmount);
    const outputToken = inputToken === 'nth' ? 'avax' : 'nth';
    
    // Update reserves
    this.reserves[inputToken] += inputAmount;
    this.reserves[outputToken] -= swapData.outputAmount;
    
    // Update volume
    this.volumeHistory.daily += inputAmount * this.getCurrentPrice();
    this.volumeHistory.weekly += inputAmount * this.getCurrentPrice();
    this.volumeHistory.monthly += inputAmount * this.getCurrentPrice();
    
    // Add new price point to history
    this.priceHistory.push({
      timestamp: Date.now(),
      price: this.getCurrentPrice()
    });
    
    // Keep only the last 30 days of price history
    if (this.priceHistory.length > 30) {
      this.priceHistory.shift();
    }
    
    // Return swap result
    return {
      inputToken,
      inputAmount,
      outputToken,
      outputAmount: swapData.outputAmount,
      priceImpact: swapData.priceImpact,
      fee: swapData.fee,
      timestamp: Date.now(),
      transactionHash: `0x${Math.random().toString(16).substring(2, 34)}` // Simulated transaction hash
    };
  }
  
  /**
   * Add liquidity to the pool
   * @param {number} nthAmount Amount of NTH to add
   * @param {number} avaxAmount Amount of AVAX to add
   * @param {string} providerAddress Provider's address
   * @returns {Object} Liquidity provision result
   */
  addLiquidity(nthAmount, avaxAmount, providerAddress) {
    if (!providerAddress) {
      throw new Error('Provider address is required');
    }
    
    if (nthAmount <= 0 || avaxAmount <= 0) {
      throw new Error('Liquidity amounts must be greater than 0');
    }
    
    // Calculate the proportion of the pool this contribution represents
    const currentNthReserve = this.reserves.nth;
    const currentAvaxReserve = this.reserves.avax;
    
    // Check if the ratio is correct
    const currentRatio = currentAvaxReserve / currentNthReserve;
    const providedRatio = avaxAmount / nthAmount;
    
    let actualNthAmount = nthAmount;
    let actualAvaxAmount = avaxAmount;
    
    // Adjust amounts to maintain the current pool ratio
    if (Math.abs(providedRatio - currentRatio) > 0.01) { // Allow 1% deviation
      // If ratio is off, adjust the AVAX amount to match the NTH amount
      actualAvaxAmount = nthAmount * currentRatio;
      console.log(`Adjusted AVAX amount to ${actualAvaxAmount} to maintain pool ratio`);
    }
    
    // Calculate LP tokens to mint (proportional to contribution)
    const totalSupply = this.getTotalLPSupply();
    let lpTokensToMint;
    
    if (totalSupply === 0) {
      // First liquidity provider - initial LP tokens
      lpTokensToMint = Math.sqrt(actualNthAmount * actualAvaxAmount);
    } else {
      // Existing liquidity - proportional to contribution
      lpTokensToMint = Math.min(
        (actualNthAmount * totalSupply) / currentNthReserve,
        (actualAvaxAmount * totalSupply) / currentAvaxReserve
      );
    }
    
    // Update reserves
    this.reserves.nth += actualNthAmount;
    this.reserves.avax += actualAvaxAmount;
    
    // Update provider's LP tokens
    const currentLPBalance = this.getLPTokenBalance(providerAddress) || 0;
    this.liquidityProviders.set(providerAddress, currentLPBalance + lpTokensToMint);
    
    return {
      nthAmount: actualNthAmount,
      avaxAmount: actualAvaxAmount,
      lpTokens: lpTokensToMint,
      poolShare: (lpTokensToMint / (totalSupply + lpTokensToMint)) * 100,
      timestamp: Date.now(),
      transactionHash: `0x${Math.random().toString(16).substring(2, 34)}` // Simulated transaction hash
    };
  }
  
  /**
   * Remove liquidity from the pool
   * @param {number} lpTokenAmount Amount of LP tokens to burn
   * @param {string} providerAddress Provider's address
   * @returns {Object} Liquidity removal result
   */
  removeLiquidity(lpTokenAmount, providerAddress) {
    if (!providerAddress) {
      throw new Error('Provider address is required');
    }
    
    const lpBalance = this.getLPTokenBalance(providerAddress) || 0;
    
    if (lpTokenAmount <= 0 || lpTokenAmount > lpBalance) {
      throw new Error(`Invalid LP token amount. You have ${lpBalance} LP tokens.`);
    }
    
    const totalSupply = this.getTotalLPSupply();
    const shareOfPool = lpTokenAmount / totalSupply;
    
    // Calculate token amounts to return
    const nthAmount = this.reserves.nth * shareOfPool;
    const avaxAmount = this.reserves.avax * shareOfPool;
    
    // Update reserves
    this.reserves.nth -= nthAmount;
    this.reserves.avax -= avaxAmount;
    
    // Update provider's LP tokens
    this.liquidityProviders.set(providerAddress, lpBalance - lpTokenAmount);
    
    return {
      nthAmount,
      avaxAmount,
      lpTokens: lpTokenAmount,
      timestamp: Date.now(),
      transactionHash: `0x${Math.random().toString(16).substring(2, 34)}` // Simulated transaction hash
    };
  }
  
  /**
   * Get LP token balance for a provider
   * @param {string} providerAddress Provider's address
   * @returns {number} LP token balance
   */
  getLPTokenBalance(providerAddress) {
    return this.liquidityProviders.get(providerAddress) || 0;
  }
  
  /**
   * Get total LP token supply
   * @returns {number} Total LP token supply
   */
  getTotalLPSupply() {
    let total = 0;
    for (const balance of this.liquidityProviders.values()) {
      total += balance;
    }
    return total;
  }
  
  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getPoolStats() {
    const totalLiquidity = this.reserves.avax * 2; // Value in AVAX (assumes NTH:AVAX is roughly 1:1)
    
    return {
      reserves: { ...this.reserves },
      price: this.getCurrentPrice(),
      totalLiquidity,
      fee: this.fee,
      volume: { ...this.volumeHistory },
      providers: this.liquidityProviders.size,
      totalLPSupply: this.getTotalLPSupply()
    };
  }
  
  /**
   * Get price history
   * @param {string} period Period to get history for (day, week, month)
   * @returns {Array} Price history
   */
  getPriceHistory(period = 'month') {
    const now = Date.now();
    let cutoffTime;
    
    switch (period) {
      case 'day':
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
    }
    
    return this.priceHistory.filter(p => p.timestamp >= cutoffTime);
  }
  
  /**
   * Set slippage tolerance
   * @param {number} tolerance Slippage tolerance as a decimal (e.g., 0.01 for 1%)
   */
  setSlippageTolerance(tolerance) {
    if (tolerance < 0 || tolerance > 0.2) {
      throw new Error('Slippage tolerance must be between 0% and 20%');
    }
    this.slippageTolerance = tolerance;
  }
}

// Initialize and make available globally
window.liquidityPool = new LiquidityPool();