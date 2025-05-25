/**
 * Exchange UI Functionality for The Nothing App
 * Handles tabs, input calculations, and form submissions for the crypto exchange
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tabs
  initExchangeTabs();
  
  // Initialize exchange forms
  initExchangeForms();
  
  // Update pool statistics
  updatePoolStats();
  
  console.log('Exchange UI initialized');
});

/**
 * Initialize exchange tab functionality
 */
function initExchangeTabs() {
  const tabs = document.querySelectorAll('.exchange-tab');
  const contents = document.querySelectorAll('.exchange-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      // Add active class to selected tab and content
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
}

/**
 * Initialize exchange forms with event listeners
 */
function initExchangeForms() {
  // Buy form
  const buyForm = document.getElementById('buy-form');
  const buyInputAmount = document.getElementById('buy-input-amount');
  const buyInputToken = document.getElementById('buy-input-token');
  const buyOutputAmount = document.getElementById('buy-output-amount');
  const buyExchangeRate = document.getElementById('buy-exchange-rate');
  const buyPriceImpact = document.getElementById('buy-price-impact');
  const buyNetworkFee = document.getElementById('buy-network-fee');
  const buyMinReceived = document.getElementById('buy-min-received');
  
  if (buyForm && buyInputAmount && buyInputToken) {
    // Update values when input amount changes
    buyInputAmount.addEventListener('input', () => {
      updateBuyValues();
    });
    
    // Update values when token changes
    buyInputToken.addEventListener('change', () => {
      updateBuyValues();
    });
    
    // Handle form submission
    buyForm.addEventListener('submit', event => {
      event.preventDefault();
      executeBuy();
    });
  }
  
  // Sell form
  const sellForm = document.getElementById('sell-form');
  const sellInputAmount = document.getElementById('sell-input-amount');
  const sellOutputToken = document.getElementById('sell-output-token');
  const sellOutputAmount = document.getElementById('sell-output-amount');
  const sellExchangeRate = document.getElementById('sell-exchange-rate');
  const sellPriceImpact = document.getElementById('sell-price-impact');
  const sellNetworkFee = document.getElementById('sell-network-fee');
  const sellMinReceived = document.getElementById('sell-min-received');
  
  if (sellForm && sellInputAmount && sellOutputToken) {
    // Update values when input amount changes
    sellInputAmount.addEventListener('input', () => {
      updateSellValues();
    });
    
    // Update values when token changes
    sellOutputToken.addEventListener('change', () => {
      updateSellValues();
    });
    
    // Handle form submission
    sellForm.addEventListener('submit', event => {
      event.preventDefault();
      executeSell();
    });
  }
  
  // Liquidity form
  const liquidityForm = document.getElementById('add-liquidity-form');
  const lpTokenAmount = document.getElementById('lp-token-amount');
  const lpToken = document.getElementById('lp-token');
  const lpNthAmount = document.getElementById('lp-nth-amount');
  const lpCurrentRatio = document.getElementById('lp-current-ratio');
  const lpContribution = document.getElementById('lp-contribution');
  
  if (liquidityForm && lpTokenAmount && lpToken && lpNthAmount) {
    // Update values when token amount changes
    lpTokenAmount.addEventListener('input', () => {
      updateLiquidityValues();
    });
    
    // Update values when token changes
    lpToken.addEventListener('change', () => {
      updateLiquidityValues();
    });
    
    // Update values when NTH amount changes
    lpNthAmount.addEventListener('input', () => {
      updateLpContribution();
    });
    
    // Handle form submission
    liquidityForm.addEventListener('submit', event => {
      event.preventDefault();
      addLiquidity();
    });
  }
  
  // Set up slippage options
  const slippageOptions = document.querySelectorAll('.slippage-option');
  if (slippageOptions.length > 0) {
    slippageOptions.forEach(option => {
      option.addEventListener('click', function() {
        // Remove active class from all options
        slippageOptions.forEach(opt => opt.classList.remove('active'));
        
        // Add active class to selected option
        this.classList.add('active');
        
        // Update calculations with new slippage
        updateBuyValues();
        updateSellValues();
      });
    });
  }
}

/**
 * Update buy form values based on current input
 */
function updateBuyValues() {
  const buyInputAmount = document.getElementById('buy-input-amount');
  const buyInputToken = document.getElementById('buy-input-token');
  const buyOutputAmount = document.getElementById('buy-output-amount');
  const buyExchangeRate = document.getElementById('buy-exchange-rate');
  const buyPriceImpact = document.getElementById('buy-price-impact');
  const buyNetworkFee = document.getElementById('buy-network-fee');
  const buyMinReceived = document.getElementById('buy-min-received');
  
  if (!buyInputAmount || !buyInputToken || !buyOutputAmount) return;
  
  const inputAmount = parseFloat(buyInputAmount.value) || 0;
  const token = buyInputToken.value;
  
  if (inputAmount <= 0) {
    buyOutputAmount.value = '';
    buyPriceImpact.textContent = '0%';
    buyMinReceived.textContent = '0 $NTH';
    return;
  }
  
  let outputAmount, rate, priceImpact, fee, minReceived;
  
  // Use crypto exchange if available
  if (window.cryptoExchange) {
    try {
      const buyDetails = window.cryptoExchange.calculateBuyPrice(token, inputAmount);
      
      outputAmount = buyDetails.outputAmount;
      rate = buyDetails.effectiveRate;
      priceImpact = buyDetails.priceImpact;
      fee = buyDetails.fee;
      
      // Get selected slippage tolerance
      const slippageOption = document.querySelector('.slippage-option.active');
      const slippageTolerance = slippageOption ? parseFloat(slippageOption.getAttribute('data-value')) : 0.01;
      
      // Calculate minimum received with slippage
      minReceived = outputAmount * (1 - slippageTolerance);
      
      // Update impact class
      if (buyPriceImpact) {
        buyPriceImpact.className = 'info-value impact-' + buyDetails.impactLevel;
      }
    } catch (error) {
      console.error('Error calculating buy price:', error);
      // Fall back to simple calculation
      outputAmount = token === 'eth' ? inputAmount * 250 : inputAmount * 20;
      priceImpact = 0.1;
      fee = inputAmount * 0.005;
      minReceived = outputAmount * 0.99;
    }
  } else {
    // Simple calculation without crypto exchange
    outputAmount = token === 'eth' ? inputAmount * 250 : inputAmount * 20;
    priceImpact = 0.1;
    fee = inputAmount * 0.005;
    minReceived = outputAmount * 0.99;
  }
  
  // Update UI
  buyOutputAmount.value = outputAmount.toFixed(2);
  
  if (buyExchangeRate) {
    buyExchangeRate.textContent = `1 ${token.toUpperCase()} = ${(outputAmount / inputAmount).toFixed(2)} $NTH`;
  }
  
  if (buyPriceImpact) {
    buyPriceImpact.textContent = `${priceImpact.toFixed(2)}%`;
  }
  
  if (buyNetworkFee) {
    buyNetworkFee.textContent = `~${fee.toFixed(6)} ${token.toUpperCase()}`;
  }
  
  if (buyMinReceived) {
    buyMinReceived.textContent = `${minReceived.toFixed(2)} $NTH`;
  }
}

/**
 * Update sell form values based on current input
 */
function updateSellValues() {
  const sellInputAmount = document.getElementById('sell-input-amount');
  const sellOutputToken = document.getElementById('sell-output-token');
  const sellOutputAmount = document.getElementById('sell-output-amount');
  const sellExchangeRate = document.getElementById('sell-exchange-rate');
  const sellPriceImpact = document.getElementById('sell-price-impact');
  const sellNetworkFee = document.getElementById('sell-network-fee');
  const sellMinReceived = document.getElementById('sell-min-received');
  
  if (!sellInputAmount || !sellOutputToken || !sellOutputAmount) return;
  
  const inputAmount = parseFloat(sellInputAmount.value) || 0;
  const token = sellOutputToken.value;
  
  if (inputAmount <= 0) {
    sellOutputAmount.value = '';
    sellPriceImpact.textContent = '0%';
    sellMinReceived.textContent = `0 ${token.toUpperCase()}`;
    return;
  }
  
  let outputAmount, rate, priceImpact, fee, minReceived;
  
  // Use crypto exchange if available
  if (window.cryptoExchange) {
    try {
      const sellDetails = window.cryptoExchange.calculateSellPrice(token, inputAmount);
      
      outputAmount = sellDetails.outputAmount;
      rate = 1 / sellDetails.effectiveRate;
      priceImpact = sellDetails.priceImpact;
      fee = sellDetails.fee;
      
      // Get selected slippage tolerance
      const slippageOption = document.querySelector('.slippage-option.active');
      const slippageTolerance = slippageOption ? parseFloat(slippageOption.getAttribute('data-value')) : 0.01;
      
      // Calculate minimum received with slippage
      minReceived = outputAmount * (1 - slippageTolerance);
      
      // Update impact class
      if (sellPriceImpact) {
        sellPriceImpact.className = 'info-value impact-' + sellDetails.impactLevel;
      }
    } catch (error) {
      console.error('Error calculating sell price:', error);
      // Fall back to simple calculation
      outputAmount = token === 'eth' ? inputAmount / 250 : inputAmount / 20;
      priceImpact = 0.1;
      fee = outputAmount * 0.005;
      minReceived = outputAmount * 0.99;
    }
  } else {
    // Simple calculation without crypto exchange
    outputAmount = token === 'eth' ? inputAmount / 250 : inputAmount / 20;
    priceImpact = 0.1;
    fee = outputAmount * 0.005;
    minReceived = outputAmount * 0.99;
  }
  
  // Update UI
  sellOutputAmount.value = outputAmount.toFixed(token === 'eth' ? 6 : 4);
  
  if (sellExchangeRate) {
    sellExchangeRate.textContent = `1 $NTH = ${(outputAmount / inputAmount).toFixed(token === 'eth' ? 6 : 4)} ${token.toUpperCase()}`;
  }
  
  if (sellPriceImpact) {
    sellPriceImpact.textContent = `${priceImpact.toFixed(2)}%`;
  }
  
  if (sellNetworkFee) {
    sellNetworkFee.textContent = `~${fee.toFixed(6)} ${token.toUpperCase()}`;
  }
  
  if (sellMinReceived) {
    sellMinReceived.textContent = `${minReceived.toFixed(token === 'eth' ? 6 : 4)} ${token.toUpperCase()}`;
  }
}

/**
 * Update liquidity form values based on current input
 */
function updateLiquidityValues() {
  const lpTokenAmount = document.getElementById('lp-token-amount');
  const lpToken = document.getElementById('lp-token');
  const lpNthAmount = document.getElementById('lp-nth-amount');
  const lpCurrentRatio = document.getElementById('lp-current-ratio');
  
  if (!lpTokenAmount || !lpToken || !lpNthAmount) return;
  
  const tokenAmount = parseFloat(lpTokenAmount.value) || 0;
  const token = lpToken.value;
  
  if (tokenAmount <= 0) {
    lpNthAmount.value = '';
    return;
  }
  
  let nthAmount, ratio;
  
  // Use crypto exchange if available
  if (window.cryptoExchange) {
    try {
      const rate = window.cryptoExchange.getCurrentRate(token);
      nthAmount = tokenAmount * rate;
      ratio = rate;
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      // Fall back to simple calculation
      nthAmount = token === 'eth' ? tokenAmount * 250 : tokenAmount * 20;
      ratio = token === 'eth' ? 250 : 20;
    }
  } else {
    // Simple calculation without crypto exchange
    nthAmount = token === 'eth' ? tokenAmount * 250 : tokenAmount * 20;
    ratio = token === 'eth' ? 250 : 20;
  }
  
  // Update UI
  lpNthAmount.value = nthAmount.toFixed(2);
  
  if (lpCurrentRatio) {
    lpCurrentRatio.textContent = `1 ${token.toUpperCase()} = ${ratio.toFixed(2)} $NTH`;
  }
  
  // Update contribution percentage
  updateLpContribution();
}

/**
 * Update liquidity contribution percentage
 */
function updateLpContribution() {
  const lpTokenAmount = document.getElementById('lp-token-amount');
  const lpToken = document.getElementById('lp-token');
  const lpNthAmount = document.getElementById('lp-nth-amount');
  const lpContribution = document.getElementById('lp-contribution');
  
  if (!lpTokenAmount || !lpToken || !lpNthAmount || !lpContribution) return;
  
  const tokenAmount = parseFloat(lpTokenAmount.value) || 0;
  const nthAmount = parseFloat(lpNthAmount.value) || 0;
  const token = lpToken.value;
  
  if (tokenAmount <= 0 || nthAmount <= 0) {
    lpContribution.textContent = '0%';
    return;
  }
  
  let contribution = 0;
  
  // Use crypto exchange if available
  if (window.cryptoExchange && window.cryptoExchange.liquidityPools) {
    try {
      const pools = window.cryptoExchange.liquidityPools;
      const pool = pools[token];
      
      if (pool) {
        // Calculate contribution as percentage of current pool
        const tokenContribution = tokenAmount / pool[token];
        const nthContribution = nthAmount / pool.nth;
        
        // Use the smaller contribution percentage
        contribution = Math.min(tokenContribution, nthContribution) * 100;
      }
    } catch (error) {
      console.error('Error calculating contribution:', error);
      // Fall back to simple calculation
      contribution = token === 'eth' ? tokenAmount / 10 : tokenAmount / 100;
    }
  } else {
    // Simple calculation without crypto exchange
    contribution = token === 'eth' ? tokenAmount / 10 : tokenAmount / 100;
  }
  
  // Update UI
  lpContribution.textContent = `${contribution.toFixed(4)}%`;
}

/**
 * Update pool statistics
 */
function updatePoolStats() {
  const avaxPoolSize = document.getElementById('avax-pool-size');
  const ethPoolSize = document.getElementById('eth-pool-size');
  const nthPoolSize = document.getElementById('nth-pool-size');
  const exchangeVolume = document.getElementById('exchange-volume');
  
  if (!avaxPoolSize || !ethPoolSize || !nthPoolSize || !exchangeVolume) return;
  
  // Use crypto exchange if available
  if (window.cryptoExchange) {
    try {
      const stats = window.cryptoExchange.getExchangeStats();
      
      // Update UI
      if (stats.liquidityPools.avax) {
        avaxPoolSize.textContent = `${stats.liquidityPools.avax.avax.toLocaleString()} AVAX`;
      }
      
      if (stats.liquidityPools.eth) {
        ethPoolSize.textContent = `${stats.liquidityPools.eth.eth.toLocaleString()} ETH`;
      }
      
      let totalNth = 0;
      if (stats.liquidityPools.avax) {
        totalNth += stats.liquidityPools.avax.nth;
      }
      if (stats.liquidityPools.eth) {
        totalNth += stats.liquidityPools.eth.nth;
      }
      
      nthPoolSize.textContent = `${totalNth.toLocaleString()} $NTH`;
      exchangeVolume.textContent = `$${stats.volume24h.toLocaleString()}`;
    } catch (error) {
      console.error('Error updating pool stats:', error);
    }
  }
}

/**
 * Execute buy transaction
 */
function executeBuy() {
  const buyInputAmount = document.getElementById('buy-input-amount');
  const buyInputToken = document.getElementById('buy-input-token');
  
  if (!buyInputAmount || !buyInputToken) return;
  
  const inputAmount = parseFloat(buyInputAmount.value) || 0;
  const token = buyInputToken.value;
  
  if (inputAmount <= 0) {
    showMessage('Please enter a valid amount', false);
    return;
  }
  
  // Check if user is connected
  if (!window.userWalletAddress) {
    showMessage('Please connect your wallet first', false);
    return;
  }
  
  // Use crypto exchange if available
  if (window.cryptoExchange) {
    try {
      const transaction = window.cryptoExchange.executeBuy(token, inputAmount, window.userWalletAddress);
      
      showMessage(`Successfully bought ${transaction.outputAmount.toFixed(2)} $NTH with ${inputAmount.toFixed(token === 'eth' ? 6 : 4)} ${token.toUpperCase()}!`, true);
      
      // Update token balance
      updateTokenBalance(transaction.outputAmount);
      
      // Clear form
      buyInputAmount.value = '';
      updateBuyValues();
      
      // Update pool stats
      updatePoolStats();
    } catch (error) {
      showMessage(error.message || 'Transaction failed', false);
    }
  } else {
    // Simple simulation without crypto exchange
    const outputAmount = token === 'eth' ? inputAmount * 250 : inputAmount * 20;
    
    showMessage(`Successfully bought ${outputAmount.toFixed(2)} $NTH with ${inputAmount.toFixed(token === 'eth' ? 6 : 4)} ${token.toUpperCase()}!`, true);
    
    // Update token balance
    updateTokenBalance(outputAmount);
    
    // Clear form
    buyInputAmount.value = '';
    updateBuyValues();
  }
}

/**
 * Execute sell transaction
 */
function executeSell() {
  const sellInputAmount = document.getElementById('sell-input-amount');
  const sellOutputToken = document.getElementById('sell-output-token');
  
  if (!sellInputAmount || !sellOutputToken) return;
  
  const inputAmount = parseFloat(sellInputAmount.value) || 0;
  const token = sellOutputToken.value;
  
  if (inputAmount <= 0) {
    showMessage('Please enter a valid amount', false);
    return;
  }
  
  // Check if user is connected
  if (!window.userWalletAddress) {
    showMessage('Please connect your wallet first', false);
    return;
  }
  
  // Use crypto exchange if available
  if (window.cryptoExchange) {
    try {
      const transaction = window.cryptoExchange.executeSell(token, inputAmount, window.userWalletAddress);
      
      showMessage(`Successfully sold ${inputAmount.toFixed(2)} $NTH for ${transaction.outputAmount.toFixed(token === 'eth' ? 6 : 4)} ${token.toUpperCase()}!`, true);
      
      // Update token balance
      updateTokenBalance(-inputAmount);
      
      // Clear form
      sellInputAmount.value = '';
      updateSellValues();
      
      // Update pool stats
      updatePoolStats();
    } catch (error) {
      showMessage(error.message || 'Transaction failed', false);
    }
  } else {
    // Simple simulation without crypto exchange
    const outputAmount = token === 'eth' ? inputAmount / 250 : inputAmount / 20;
    
    showMessage(`Successfully sold ${inputAmount.toFixed(2)} $NTH for ${outputAmount.toFixed(token === 'eth' ? 6 : 4)} ${token.toUpperCase()}!`, true);
    
    // Update token balance
    updateTokenBalance(-inputAmount);
    
    // Clear form
    sellInputAmount.value = '';
    updateSellValues();
  }
}

/**
 * Add liquidity to pool
 */
function addLiquidity() {
  const lpTokenAmount = document.getElementById('lp-token-amount');
  const lpToken = document.getElementById('lp-token');
  const lpNthAmount = document.getElementById('lp-nth-amount');
  
  if (!lpTokenAmount || !lpToken || !lpNthAmount) return;
  
  const tokenAmount = parseFloat(lpTokenAmount.value) || 0;
  const nthAmount = parseFloat(lpNthAmount.value) || 0;
  const token = lpToken.value;
  
  if (tokenAmount <= 0 || nthAmount <= 0) {
    showMessage('Please enter valid amounts', false);
    return;
  }
  
  // Check if user is connected
  if (!window.userWalletAddress) {
    showMessage('Please connect your wallet first', false);
    return;
  }
  
  // Use crypto exchange if available
  if (window.cryptoExchange) {
    try {
      const result = window.cryptoExchange.addLiquidity(token, tokenAmount, nthAmount, window.userWalletAddress);
      
      showMessage(`Successfully added ${result.tokenAmount.toFixed(token === 'eth' ? 6 : 4)} ${token.toUpperCase()} and ${result.nthAmount.toFixed(2)} $NTH to the liquidity pool!`, true);
      
      // Update token balance
      updateTokenBalance(-result.nthAmount);
      
      // Clear form
      lpTokenAmount.value = '';
      lpNthAmount.value = '';
      updateLiquidityValues();
      
      // Update pool stats
      updatePoolStats();
    } catch (error) {
      showMessage(error.message || 'Transaction failed', false);
    }
  } else {
    // Simple simulation without crypto exchange
    showMessage(`Successfully added ${tokenAmount.toFixed(token === 'eth' ? 6 : 4)} ${token.toUpperCase()} and ${nthAmount.toFixed(2)} $NTH to the liquidity pool!`, true);
    
    // Update token balance
    updateTokenBalance(-nthAmount);
    
    // Clear form
    lpTokenAmount.value = '';
    lpNthAmount.value = '';
    updateLiquidityValues();
  }
}

/**
 * Update token balance display
 * @param {number} amount - Amount to add (positive) or subtract (negative)
 */
function updateTokenBalance(amount) {
  const tokenBalanceElement = document.getElementById('token-balance');
  if (!tokenBalanceElement) return;
  
  const currentBalance = parseFloat(tokenBalanceElement.textContent) || 100;
  const newBalance = currentBalance + amount;
  
  tokenBalanceElement.textContent = `${newBalance.toFixed(2)} $NTH`;
}

/**
 * Show message in UI
 * @param {string} message - Message to display
 * @param {boolean} isSuccess - Whether message is success or error
 */
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