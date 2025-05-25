/**
 * Staking Handler for The Nothing App
 * Manages staking functionality and UI updates
 */

document.addEventListener('DOMContentLoaded', function() {
  // Store staking data
  const stakingData = {
    userStakes: [],
    totalStaked: 0,
    pendingRewards: 0,
    networkStaked: 10000 + Math.floor(Math.random() * 50000),
    baseAPY: 0.08, // 8% base APY
    maxAPY: 0.20   // 20% max APY
  };

  // Update the staking UI with current data
  function updateStakingUI() {
    // Update staking stats
    const totalStakedElement = document.getElementById('total-staked');
    const pendingRewardsElement = document.getElementById('pending-rewards');
    const networkStakedElement = document.getElementById('network-staked');
    
    if (totalStakedElement) {
      totalStakedElement.textContent = `${stakingData.totalStaked.toFixed(2)} $NTH`;
    }
    
    if (pendingRewardsElement) {
      pendingRewardsElement.textContent = `${stakingData.pendingRewards.toFixed(2)} $NTH`;
    }
    
    if (networkStakedElement) {
      networkStakedElement.textContent = `${stakingData.networkStaked.toLocaleString()} $NTH`;
    }
    
    // Update staking form elements
    updateEstimatedRewards();
    
    // Update active stakes display
    displayActiveStakes();
  }
  
  // Calculate APY based on staking duration
  function calculateAPY(durationInDays) {
    const minDuration = 7;
    const maxDuration = 365;
    
    if (durationInDays < minDuration) return stakingData.baseAPY;
    
    // Linear interpolation between base and max APY
    const factor = Math.min(1, (durationInDays - minDuration) / (maxDuration - minDuration));
    const apy = stakingData.baseAPY + (stakingData.maxAPY - stakingData.baseAPY) * factor;
    
    return parseFloat(apy.toFixed(4));
  }
  
  // Update estimated rewards display
  function updateEstimatedRewards() {
    const amountInput = document.getElementById('stake-amount');
    const durationSlider = document.getElementById('stake-duration');
    const apyRateElement = document.getElementById('apy-rate');
    const estRewardsElement = document.getElementById('est-rewards');
    const totalAtMaturityElement = document.getElementById('total-at-maturity');
    
    if (!amountInput || !durationSlider || !apyRateElement || !estRewardsElement || !totalAtMaturityElement) {
      return;
    }
    
    const amount = parseFloat(amountInput.value) || 0;
    const duration = parseInt(durationSlider.value) || 30;
    const apy = calculateAPY(duration);
    
    // Update APY display
    apyRateElement.textContent = `${(apy * 100).toFixed(1)}%`;
    
    // Calculate estimated rewards
    const rewards = amount * apy * (duration / 365);
    estRewardsElement.textContent = `${rewards.toFixed(2)} $NTH`;
    
    // Calculate total at maturity
    totalAtMaturityElement.textContent = `${(amount + rewards).toFixed(2)} $NTH`;
  }
  
  // Display active stakes
  function displayActiveStakes() {
    const activeStakesContainer = document.getElementById('active-stakes-container');
    if (!activeStakesContainer) return;
    
    if (stakingData.userStakes.length === 0) {
      activeStakesContainer.innerHTML = `
        <div class="no-stakes-message">
          <p>You don't have any active stakes. Start staking to earn rewards!</p>
        </div>
      `;
      return;
    }
    
    // Clear container
    activeStakesContainer.innerHTML = '';
    
    // Add each stake
    stakingData.userStakes.forEach(stake => {
      const startDate = new Date(stake.startDate);
      const endDate = new Date(stake.endDate);
      const now = new Date();
      
      // Calculate progress
      const totalDuration = endDate - startDate;
      const elapsed = now - startDate;
      const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      
      // Format dates
      const startDateStr = startDate.toLocaleDateString();
      const endDateStr = endDate.toLocaleDateString();
      
      // Create stake element
      const stakeElement = document.createElement('div');
      stakeElement.className = 'stake-item';
      stakeElement.innerHTML = `
        <div class="stake-header">
          <div class="stake-amount">${stake.amount.toFixed(2)} $NTH</div>
          <div class="stake-date">${startDateStr} - ${endDateStr}</div>
        </div>
        
        <div class="stake-details">
          <div class="stake-detail">
            <div class="detail-label">APY</div>
            <div class="detail-value">${(stake.apy * 100).toFixed(1)}%</div>
          </div>
          <div class="stake-detail">
            <div class="detail-label">Duration</div>
            <div class="detail-value">${stake.duration} days</div>
          </div>
          <div class="stake-detail">
            <div class="detail-label">Rewards</div>
            <div class="detail-value">${stake.rewards.toFixed(2)} $NTH</div>
          </div>
        </div>
        
        <div class="stake-progress">
          <div class="progress-bar" style="width: ${progressPercent}%"></div>
        </div>
        
        <div class="stake-actions">
          <button class="btn secondary-btn unstake-btn" data-stake-id="${stake.id}">Unstake</button>
        </div>
      `;
      
      // Add unstake button listener
      const unstakeBtn = stakeElement.querySelector('.unstake-btn');
      if (unstakeBtn) {
        unstakeBtn.addEventListener('click', () => unstakeTokens(stake.id));
      }
      
      activeStakesContainer.appendChild(stakeElement);
    });
  }
  
  // Create a new stake
  function stakeTokens(amount, duration) {
    if (!amount || amount <= 0) {
      showMessage('Please enter a valid amount to stake', false);
      return;
    }
    
    if (!duration || duration < 7) {
      showMessage('Minimum staking period is 7 days', false);
      return;
    }
    
    // Check if user has enough tokens (mock validation)
    const currentBalance = 100; // In a real app, this would be fetched from the blockchain
    if (amount > currentBalance) {
      showMessage(`Insufficient balance. You have ${currentBalance} $NTH available.`, false);
      return;
    }
    
    // Create stake object
    const stakeId = Date.now().toString();
    const apy = calculateAPY(duration);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);
    
    const stake = {
      id: stakeId,
      amount: amount,
      apy: apy,
      duration: duration,
      startDate: startDate,
      endDate: endDate,
      rewards: 0,
      isActive: true
    };
    
    // Add stake to user's stakes
    stakingData.userStakes.push(stake);
    stakingData.totalStaked += amount;
    
    // In a real app, this would interact with the blockchain
    
    // Update UI
    updateStakingUI();
    showMessage('Tokens successfully staked!', true);
    
    // Start computing rewards
    updateRewards();
    
    return stake;
  }
  
  // Unstake tokens
  function unstakeTokens(stakeId) {
    const stakeIndex = stakingData.userStakes.findIndex(stake => stake.id === stakeId);
    if (stakeIndex === -1) {
      showMessage('Stake not found', false);
      return;
    }
    
    const stake = stakingData.userStakes[stakeIndex];
    
    // Calculate final rewards
    updateStakeRewards(stake);
    
    // Mark as inactive
    stake.isActive = false;
    
    // In a real app, this would return tokens to the user's wallet via blockchain
    stakingData.totalStaked -= stake.amount;
    
    // Update UI
    updateStakingUI();
    showMessage(`Successfully unstaked ${stake.amount.toFixed(2)} $NTH and earned ${stake.rewards.toFixed(2)} $NTH in rewards!`, true);
    
    return {
      amount: stake.amount,
      rewards: stake.rewards,
      total: stake.amount + stake.rewards
    };
  }
  
  // Update rewards for all stakes
  function updateRewards() {
    let totalPendingRewards = 0;
    
    stakingData.userStakes.forEach(stake => {
      if (stake.isActive) {
        updateStakeRewards(stake);
        totalPendingRewards += stake.rewards;
      }
    });
    
    stakingData.pendingRewards = totalPendingRewards;
    
    // Update UI if rewards changed
    updateStakingUI();
  }
  
  // Update rewards for a single stake
  function updateStakeRewards(stake) {
    if (!stake.isActive) return;
    
    const startDate = new Date(stake.startDate);
    const endDate = new Date(stake.endDate);
    const now = new Date();
    
    // If stake hasn't started yet
    if (now < startDate) {
      stake.rewards = 0;
      return;
    }
    
    // If stake is completed
    if (now > endDate) {
      stake.rewards = stake.amount * stake.apy * (stake.duration / 365);
      return;
    }
    
    // Calculate partial rewards
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now - startDate) / (1000 * 60 * 60 * 24);
    stake.rewards = stake.amount * stake.apy * (elapsedDays / 365);
  }
  
  // Show message in UI
  function showMessage(message, isSuccess) {
    const successMessage = document.getElementById('token-message');
    const errorMessage = document.getElementById('token-error');
    
    if (!successMessage || !errorMessage) return;
    
    if (isSuccess) {
      successMessage.textContent = message;
      successMessage.classList.remove('hidden');
      errorMessage.classList.add('hidden');
      
      setTimeout(() => {
        successMessage.classList.add('hidden');
      }, 5000);
    } else {
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
      successMessage.classList.add('hidden');
      
      setTimeout(() => {
        errorMessage.classList.add('hidden');
      }, 5000);
    }
  }
  
  // Set up event listeners
  
  // Staking form submission
  const stakingForm = document.getElementById('staking-form');
  if (stakingForm) {
    stakingForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const amountInput = document.getElementById('stake-amount');
      const durationInput = document.getElementById('stake-duration');
      
      if (!amountInput || !durationInput) return;
      
      const amount = parseFloat(amountInput.value);
      const duration = parseInt(durationInput.value);
      
      stakeTokens(amount, duration);
      amountInput.value = '';
    });
  }
  
  // Duration slider
  const durationSlider = document.getElementById('stake-duration');
  const durationValue = document.getElementById('duration-value');
  
  if (durationSlider && durationValue) {
    durationSlider.addEventListener('input', function() {
      const duration = parseInt(durationSlider.value);
      durationValue.textContent = `${duration} days`;
      updateEstimatedRewards();
    });
  }
  
  // Stake amount input
  const stakeAmount = document.getElementById('stake-amount');
  if (stakeAmount) {
    stakeAmount.addEventListener('input', function() {
      updateEstimatedRewards();
    });
  }
  
  // Claim all rewards button
  const claimAllRewardsBtn = document.getElementById('claim-all-rewards');
  if (claimAllRewardsBtn) {
    claimAllRewardsBtn.addEventListener('click', function() {
      if (stakingData.pendingRewards <= 0) {
        showMessage('No rewards to claim', false);
        return;
      }
      
      // In a real app, this would transfer rewards to the user's wallet
      showMessage(`Successfully claimed ${stakingData.pendingRewards.toFixed(2)} $NTH in rewards!`, true);
      
      // Reset pending rewards
      stakingData.pendingRewards = 0;
      stakingData.userStakes.forEach(stake => {
        if (stake.isActive) {
          stake.rewards = 0;
        }
      });
      
      updateStakingUI();
    });
  }
  
  // Start periodically updating rewards
  setInterval(updateRewards, 10000); // Update every 10 seconds
  
  // Initialize UI
  updateStakingUI();
  
  // Make functions available globally
  window.stakingHandler = {
    stakeTokens,
    unstakeTokens,
    updateStakingUI,
    stakingData
  };
});