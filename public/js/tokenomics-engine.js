/**
 * Advanced Tokenomics Engine for The Nothing App
 * Implements staking, rewards, and other tokenomics mechanisms
 */

class TokenomicsEngine {
  constructor() {
    // Staking pool configuration
    this.stakingConfig = {
      minStakeAmount: 10, // Minimum amount of tokens that can be staked
      maxStakeAmount: 10000, // Maximum amount of tokens that can be staked
      baseAPY: 0.12, // 12% base annual percentage yield
      bonusAPY: 0.08, // 8% additional APY for long-term stakers
      compoundingFrequency: 86400, // Daily compounding (in seconds)
      minStakeDuration: 7 * 86400, // Minimum 7 days staking period
      earlyWithdrawalFee: 0.05, // 5% fee for early withdrawal
      rewardPoolAddress: '0x0000000000000000000000000000000000000000', // Placeholder for reward pool
      totalStaked: 0, // Total amount of tokens staked in the platform
      rewardPool: 1000000, // Initial reward pool size
    };
    
    // Active stakes by user address
    this.stakes = new Map();
    
    // Reward distribution history
    this.rewardHistory = [];
    
    // Initialize if Web3 is available
    this.initWeb3();
  }

  /**
   * Initialize Web3 connection
   */
  async initWeb3() {
    if (window.avalancheConnector && window.avalancheConnector.isConnected) {
      this.web3 = window.avalancheConnector.web3;
      console.log('Tokenomics engine initialized with Web3');
      
      // Load token contract
      if (window.nothingToken) {
        this.tokenContract = window.nothingToken;
        console.log('Token contract loaded in tokenomics engine');
      }
      
      // Load staking data for current user if connected
      const userAddress = await window.avalancheConnector.getConnectedAddress();
      if (userAddress) {
        this.loadUserStakes(userAddress);
      }
    } else {
      console.log('Web3 not available for tokenomics engine');
    }
    
    // Set up event listeners
    document.addEventListener('wallet-connected', (event) => {
      if (event.detail && event.detail.address) {
        this.loadUserStakes(event.detail.address);
      }
    });
  }

  /**
   * Load user stakes from storage or blockchain
   * @param {string} userAddress - User's wallet address
   */
  async loadUserStakes(userAddress) {
    try {
      // In a production app, this would load from blockchain
      // For now, we'll use localStorage for demo purposes
      const savedStakes = localStorage.getItem(`nth_stakes_${userAddress}`);
      if (savedStakes) {
        const userStakes = JSON.parse(savedStakes);
        this.stakes.set(userAddress, userStakes);
        console.log(`Loaded ${userStakes.length} stakes for user ${userAddress}`);
      } else {
        this.stakes.set(userAddress, []);
      }
    } catch (error) {
      console.error('Error loading user stakes:', error);
      this.stakes.set(userAddress, []);
    }
  }

  /**
   * Save user stakes to storage
   * @param {string} userAddress - User's wallet address
   */
  async saveUserStakes(userAddress) {
    try {
      const userStakes = this.stakes.get(userAddress) || [];
      localStorage.setItem(`nth_stakes_${userAddress}`, JSON.stringify(userStakes));
    } catch (error) {
      console.error('Error saving user stakes:', error);
    }
  }

  /**
   * Stake tokens
   * @param {string} userAddress - User's wallet address
   * @param {number} amount - Amount of tokens to stake
   * @param {number} duration - Duration to stake in days
   * @returns {Promise<Object>} Stake details or error
   */
  async stakeTokens(userAddress, amount, duration) {
    try {
      // Validate parameters
      if (!userAddress) throw new Error('User address is required');
      if (!amount || amount < this.stakingConfig.minStakeAmount) {
        throw new Error(`Minimum stake amount is ${this.stakingConfig.minStakeAmount} NTH`);
      }
      if (amount > this.stakingConfig.maxStakeAmount) {
        throw new Error(`Maximum stake amount is ${this.stakingConfig.maxStakeAmount} NTH`);
      }
      if (!duration || duration < (this.stakingConfig.minStakeDuration / 86400)) {
        throw new Error(`Minimum stake duration is ${this.stakingConfig.minStakeDuration / 86400} days`);
      }
      
      // Check token balance
      let userBalance = 0;
      if (this.tokenContract) {
        userBalance = await this.tokenContract.getBalance(userAddress);
      } else {
        // Use mock balance for demo if contract not available
        userBalance = 1000;
      }
      
      if (userBalance < amount) {
        throw new Error(`Insufficient balance. You have ${userBalance} NTH.`);
      }
      
      // Create stake record
      const stakeId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
      const durationInSeconds = duration * 86400;
      const stake = {
        id: stakeId,
        amount: amount,
        startTime: Date.now(),
        endTime: Date.now() + (durationInSeconds * 1000),
        duration: durationInSeconds,
        apy: this.calculateAPY(duration),
        status: 'active',
        rewards: 0,
        lastCompoundingTime: Date.now()
      };
      
      // Add to user's stakes
      let userStakes = this.stakes.get(userAddress);
      if (!userStakes) {
        userStakes = [];
        this.stakes.set(userAddress, userStakes);
      }
      userStakes.push(stake);
      
      // Update total staked amount
      this.stakingConfig.totalStaked += amount;
      
      // Save stakes
      await this.saveUserStakes(userAddress);
      
      // In a real implementation, this would call the smart contract
      console.log(`User ${userAddress} staked ${amount} NTH for ${duration} days`);
      
      return stake;
    } catch (error) {
      console.error('Error staking tokens:', error);
      throw error;
    }
  }

  /**
   * Calculate APY based on staking duration
   * @param {number} durationInDays - Staking duration in days
   * @returns {number} Calculated APY
   */
  calculateAPY(durationInDays) {
    let apy = this.stakingConfig.baseAPY;
    
    // Add bonus APY for longer stakes
    if (durationInDays >= 30) {
      // Linear increase in bonus APY based on duration
      const bonusFactor = Math.min(1, (durationInDays - 30) / 335); // Max bonus at 1 year
      apy += this.stakingConfig.bonusAPY * bonusFactor;
    }
    
    return apy;
  }

  /**
   * Calculate rewards for a stake
   * @param {Object} stake - Stake object
   * @returns {number} Calculated rewards
   */
  calculateRewards(stake) {
    const now = Date.now();
    const elapsedTimeInSeconds = (now - stake.startTime) / 1000;
    
    if (elapsedTimeInSeconds <= 0 || stake.status !== 'active') {
      return 0;
    }
    
    // Calculate time since last compounding
    const timeSinceLastCompoundingInSeconds = (now - stake.lastCompoundingTime) / 1000;
    
    // Only compound if enough time has passed
    if (timeSinceLastCompoundingInSeconds < this.stakingConfig.compoundingFrequency) {
      return stake.rewards;
    }
    
    // Calculate number of compounding periods
    const compoundingPeriods = Math.floor(timeSinceLastCompoundingInSeconds / 
                                         this.stakingConfig.compoundingFrequency);
    
    if (compoundingPeriods <= 0) {
      return stake.rewards;
    }
    
    // Calculate rewards with compounding
    let principal = stake.amount + stake.rewards;
    const periodicRate = stake.apy / (365 * 86400 / this.stakingConfig.compoundingFrequency);
    
    for (let i = 0; i < compoundingPeriods; i++) {
      const periodReward = principal * periodicRate;
      principal += periodReward;
    }
    
    const totalRewards = principal - stake.amount;
    return Math.max(0, totalRewards);
  }

  /**
   * Update rewards for all active stakes
   */
  updateAllRewards() {
    const now = Date.now();
    
    // Update rewards for all users
    for (const [userAddress, userStakes] of this.stakes.entries()) {
      let updated = false;
      
      for (const stake of userStakes) {
        if (stake.status === 'active') {
          // Calculate rewards
          const newRewards = this.calculateRewards(stake);
          
          if (newRewards !== stake.rewards) {
            stake.rewards = newRewards;
            stake.lastCompoundingTime = now;
            updated = true;
          }
          
          // Check if stake has ended
          if (now > stake.endTime) {
            stake.status = 'completed';
            updated = true;
          }
        }
      }
      
      // Save updated stakes
      if (updated) {
        this.saveUserStakes(userAddress);
      }
    }
  }

  /**
   * Unstake tokens and claim rewards
   * @param {string} userAddress - User's wallet address
   * @param {string} stakeId - ID of the stake to unstake
   * @returns {Promise<Object>} Unstake details
   */
  async unstakeTokens(userAddress, stakeId) {
    try {
      const userStakes = this.stakes.get(userAddress);
      if (!userStakes) {
        throw new Error('No stakes found for this user');
      }
      
      // Find the stake
      const stakeIndex = userStakes.findIndex(stake => stake.id === stakeId);
      if (stakeIndex === -1) {
        throw new Error('Stake not found');
      }
      
      const stake = userStakes[stakeIndex];
      if (stake.status !== 'active') {
        throw new Error('Stake is not active');
      }
      
      // Update rewards before unstaking
      stake.rewards = this.calculateRewards(stake);
      
      // Check if early withdrawal
      const isEarlyWithdrawal = Date.now() < stake.endTime;
      let withdrawalFee = 0;
      
      if (isEarlyWithdrawal) {
        withdrawalFee = stake.amount * this.stakingConfig.earlyWithdrawalFee;
      }
      
      // Calculate total amount to return to user
      const totalAmount = stake.amount + stake.rewards - withdrawalFee;
      
      // Update stake status
      stake.status = 'unstaked';
      stake.unstakeTime = Date.now();
      stake.withdrawalFee = withdrawalFee;
      stake.totalReturned = totalAmount;
      
      // Update total staked amount
      this.stakingConfig.totalStaked -= stake.amount;
      
      // Save stakes
      await this.saveUserStakes(userAddress);
      
      // In a real implementation, this would call the smart contract
      console.log(`User ${userAddress} unstaked ${stake.amount} NTH and received ${totalAmount} NTH`);
      
      return {
        stakeId: stake.id,
        originalAmount: stake.amount,
        rewards: stake.rewards,
        withdrawalFee: withdrawalFee,
        totalReturned: totalAmount,
        isEarlyWithdrawal: isEarlyWithdrawal
      };
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      throw error;
    }
  }

  /**
   * Get user's active stakes
   * @param {string} userAddress - User's wallet address
   * @returns {Array} User's active stakes
   */
  getUserStakes(userAddress) {
    // Ensure rewards are up to date
    this.updateAllRewards();
    
    const userStakes = this.stakes.get(userAddress) || [];
    return userStakes;
  }

  /**
   * Get user's total staked amount
   * @param {string} userAddress - User's wallet address
   * @returns {number} Total staked amount
   */
  getUserTotalStaked(userAddress) {
    const userStakes = this.stakes.get(userAddress) || [];
    return userStakes
      .filter(stake => stake.status === 'active')
      .reduce((total, stake) => total + stake.amount, 0);
  }

  /**
   * Get user's total pending rewards
   * @param {string} userAddress - User's wallet address
   * @returns {number} Total pending rewards
   */
  getUserTotalRewards(userAddress) {
    // Ensure rewards are up to date
    this.updateAllRewards();
    
    const userStakes = this.stakes.get(userAddress) || [];
    return userStakes
      .filter(stake => stake.status === 'active')
      .reduce((total, stake) => total + stake.rewards, 0);
  }

  /**
   * Get global staking statistics
   * @returns {Object} Global staking statistics
   */
  getGlobalStats() {
    return {
      totalStaked: this.stakingConfig.totalStaked,
      totalStakers: this.stakes.size,
      averageAPY: this.stakingConfig.baseAPY + (this.stakingConfig.bonusAPY / 2), // Estimate
      rewardPool: this.stakingConfig.rewardPool
    };
  }
}

// Initialize tokenomics engine
window.tokenomicsEngine = new TokenomicsEngine();