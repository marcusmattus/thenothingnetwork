/**
 * Buy Token Feature for The Nothing App
 * Handles token purchase and swapping functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // Cache DOM elements
  let buyForm, sellForm, swapForm;
  let buyAmount, buyPrice, buyTotal;
  let sellAmount, sellPrice, sellTotal;
  let swapFromAmount, swapToAmount, swapRate, swapImpact;
  let currentPrice = 0.05; // Default starting price in AVAX
  
  // Initialize the UI
  function initBuyInterface() {
    console.log('Initializing buy token interface');
    
    // Get form elements
    buyForm = document.getElementById('buy-form');
    sellForm = document.getElementById('sell-form');
    swapForm = document.getElementById('swap-form');
    
    // Get buy input elements
    buyAmount = document.getElementById('buy-amount');
    buyPrice = document.getElementById('buy-price');
    buyTotal = document.getElementById('buy-total');
    
    // Get sell input elements
    sellAmount = document.getElementById('sell-amount');
    sellPrice = document.getElementById('sell-price');
    sellTotal = document.getElementById('sell-total');
    
    // Get swap input elements
    swapFromAmount = document.getElementById('swap-from-amount');
    swapToAmount = document.getElementById('swap-to-amount');
    swapRate = document.getElementById('swap-rate');
    swapImpact = document.getElementById('swap-impact');
    
    // Set initial values
    updatePriceDisplay();
    
    // Add event listeners
    attachEventListeners();
  }
  
  // Attach event listeners to form elements
  function attachEventListeners() {
    // Buy form events
    if (buyForm) {
      buyForm.addEventListener('submit', handleBuySubmit);
      
      if (buyAmount) {
        buyAmount.addEventListener('input', updateBuyTotal);
      }
    }
    
    // Sell form events
    if (sellForm) {
      sellForm.addEventListener('submit', handleSellSubmit);
      
      if (sellAmount) {
        sellAmount.addEventListener('input', updateSellTotal);
      }
    }
    
    // Swap form events
    if (swapForm) {
      swapForm.addEventListener('submit', handleSwapSubmit);
      
      if (swapFromAmount) {
        swapFromAmount.addEventListener('input', updateSwapEstimate);
      }
    }
    
    // Set up slippage selector
    const slippageOptions = document.querySelectorAll('.slippage-option');
    if (slippageOptions.length > 0) {
      slippageOptions.forEach(option => {
        option.addEventListener('click', function() {
          // Remove active class from all options
          slippageOptions.forEach(opt => opt.classList.remove('active'));
          
          // Add active class to selected option
          this.classList.add('active');
          
          // Update slippage value
          const slippageValue = parseFloat(this.getAttribute('data-value'));
          if (window.liquidityPool) {
            window.liquidityPool.setSlippageTolerance(slippageValue);
          }
          
          // Update swap estimate with new slippage
          updateSwapEstimate();
        });
      });
    }
  }
  
  // Update price display
  function updatePriceDisplay() {
    // Get current price from liquidity pool if available
    if (window.liquidityPool) {
      currentPrice = window.liquidityPool.getCurrentPrice();
    }
    
    // Update price displays
    if (buyPrice) buyPrice.textContent = `${currentPrice.toFixed(5)} AVAX`;
    if (sellPrice) sellPrice.textContent = `${currentPrice.toFixed(5)} AVAX`;
    
    // Update swap rate display
    if (swapRate) swapRate.textContent = `1 NTH = ${currentPrice.toFixed(5)} AVAX`;
    
    // Update token price in header if exists
    const tokenPriceElement = document.getElementById('token-price');
    if (tokenPriceElement) {
      tokenPriceElement.textContent = `${currentPrice.toFixed(5)} AVAX`;
    }
  }
  
  // Update buy total
  function updateBuyTotal() {
    if (!buyAmount || !buyTotal) return;
    
    const amount = parseFloat(buyAmount.value) || 0;
    const total = amount * currentPrice;
    
    buyTotal.textContent = `${total.toFixed(5)} AVAX`;
  }
  
  // Update sell total
  function updateSellTotal() {
    if (!sellAmount || !sellTotal) return;
    
    const amount = parseFloat(sellAmount.value) || 0;
    const total = amount * currentPrice;
    
    sellTotal.textContent = `${total.toFixed(5)} AVAX`;
  }
  
  // Update swap estimate
  function updateSwapEstimate() {
    if (!swapFromAmount || !swapToAmount || !swapImpact) return;
    
    const amount = parseFloat(swapFromAmount.value) || 0;
    
    if (amount <= 0) {
      swapToAmount.value = '';
      swapImpact.textContent = '0%';
      return;
    }
    
    // Get swap estimate from liquidity pool
    if (window.liquidityPool) {
      try {
        const fromToken = document.querySelector('input[name="swap-from-token"]:checked').value;
        const swapData = window.liquidityPool.getSwapOutput(fromToken, amount);
        
        swapToAmount.value = swapData.outputAmount.toFixed(5);
        swapImpact.textContent = `${(swapData.priceImpact * 100).toFixed(2)}%`;
        
        // Set price impact color
        if (swapData.priceImpact > window.liquidityPool.highImpactThreshold) {
          swapImpact.className = 'high-impact';
        } else if (swapData.priceImpact > window.liquidityPool.lowImpactThreshold) {
          swapImpact.className = 'medium-impact';
        } else {
          swapImpact.className = 'low-impact';
        }
      } catch (error) {
        console.error('Error calculating swap:', error);
        swapToAmount.value = '';
        swapImpact.textContent = 'Error';
      }
    } else {
      // Fallback calculation if liquidity pool is not available
      const toToken = document.querySelector('input[name="swap-to-token"]:checked').value;
      
      if (toToken === 'avax') {
        swapToAmount.value = (amount * currentPrice).toFixed(5);
      } else {
        swapToAmount.value = (amount / currentPrice).toFixed(5);
      }
      
      swapImpact.textContent = 'N/A';
    }
  }
  
  // Handle buy form submission
  function handleBuySubmit(event) {
    event.preventDefault();
    
    const amount = parseFloat(buyAmount.value) || 0;
    
    if (amount <= 0) {
      showMessage('Please enter a valid amount to buy', false);
      return;
    }
    
    // Check if user is connected
    if (!window.userWalletAddress) {
      showMessage('Please connect your wallet first', false);
      return;
    }
    
    // Check if liquidity pool is available
    if (window.liquidityPool) {
      try {
        const swapResult = window.liquidityPool.executeSwap('avax', amount * currentPrice, window.userWalletAddress);
        
        showMessage(`Successfully bought ${swapResult.outputAmount.toFixed(2)} NTH tokens!`, true);
        buyAmount.value = '';
        updateBuyTotal();
        updatePriceDisplay();
        
        // Update token balance if available
        updateTokenBalance(swapResult.outputAmount);
      } catch (error) {
        showMessage(error.message || 'Failed to buy tokens', false);
      }
    } else {
      // Simulate purchase if liquidity pool is not available
      const total = amount * currentPrice;
      
      showMessage(`Successfully bought ${amount.toFixed(2)} NTH tokens for ${total.toFixed(5)} AVAX!`, true);
      buyAmount.value = '';
      updateBuyTotal();
      
      // Update token balance if available
      updateTokenBalance(amount);
    }
  }
  
  // Handle sell form submission
  function handleSellSubmit(event) {
    event.preventDefault();
    
    const amount = parseFloat(sellAmount.value) || 0;
    
    if (amount <= 0) {
      showMessage('Please enter a valid amount to sell', false);
      return;
    }
    
    // Check if user is connected
    if (!window.userWalletAddress) {
      showMessage('Please connect your wallet first', false);
      return;
    }
    
    // Check if liquidity pool is available
    if (window.liquidityPool) {
      try {
        const swapResult = window.liquidityPool.executeSwap('nth', amount, window.userWalletAddress);
        
        showMessage(`Successfully sold ${amount.toFixed(2)} NTH tokens for ${swapResult.outputAmount.toFixed(5)} AVAX!`, true);
        sellAmount.value = '';
        updateSellTotal();
        updatePriceDisplay();
        
        // Update token balance if available
        updateTokenBalance(-amount);
      } catch (error) {
        showMessage(error.message || 'Failed to sell tokens', false);
      }
    } else {
      // Simulate sale if liquidity pool is not available
      const total = amount * currentPrice;
      
      showMessage(`Successfully sold ${amount.toFixed(2)} NTH tokens for ${total.toFixed(5)} AVAX!`, true);
      sellAmount.value = '';
      updateSellTotal();
      
      // Update token balance if available
      updateTokenBalance(-amount);
    }
  }
  
  // Handle swap form submission
  function handleSwapSubmit(event) {
    event.preventDefault();
    
    const fromAmount = parseFloat(swapFromAmount.value) || 0;
    
    if (fromAmount <= 0) {
      showMessage('Please enter a valid amount to swap', false);
      return;
    }
    
    // Check if user is connected
    if (!window.userWalletAddress) {
      showMessage('Please connect your wallet first', false);
      return;
    }
    
    const fromToken = document.querySelector('input[name="swap-from-token"]:checked').value;
    const toToken = document.querySelector('input[name="swap-to-token"]:checked').value;
    
    if (fromToken === toToken) {
      showMessage('Cannot swap to the same token', false);
      return;
    }
    
    // Check if liquidity pool is available
    if (window.liquidityPool) {
      try {
        const swapResult = window.liquidityPool.executeSwap(fromToken, fromAmount, window.userWalletAddress);
        
        showMessage(`Successfully swapped ${fromAmount.toFixed(fromToken === 'nth' ? 2 : 5)} ${fromToken.toUpperCase()} for ${swapResult.outputAmount.toFixed(toToken === 'nth' ? 2 : 5)} ${toToken.toUpperCase()}!`, true);
        swapFromAmount.value = '';
        swapToAmount.value = '';
        updatePriceDisplay();
        
        // Update token balance if applicable
        if (fromToken === 'nth') {
          updateTokenBalance(-fromAmount);
        } else if (toToken === 'nth') {
          updateTokenBalance(swapResult.outputAmount);
        }
      } catch (error) {
        showMessage(error.message || 'Failed to execute swap', false);
      }
    } else {
      // Simulate swap if liquidity pool is not available
      let toAmount;
      
      if (fromToken === 'nth') {
        toAmount = fromAmount * currentPrice;
        showMessage(`Successfully swapped ${fromAmount.toFixed(2)} NTH for ${toAmount.toFixed(5)} AVAX!`, true);
        updateTokenBalance(-fromAmount);
      } else {
        toAmount = fromAmount / currentPrice;
        showMessage(`Successfully swapped ${fromAmount.toFixed(5)} AVAX for ${toAmount.toFixed(2)} NTH!`, true);
        updateTokenBalance(toAmount);
      }
      
      swapFromAmount.value = '';
      swapToAmount.value = '';
    }
  }
  
  // Update token balance
  function updateTokenBalance(amount) {
    const tokenBalanceElement = document.getElementById('token-balance');
    if (!tokenBalanceElement) return;
    
    const currentBalance = parseFloat(tokenBalanceElement.textContent) || 100;
    const newBalance = currentBalance + amount;
    
    tokenBalanceElement.textContent = `${newBalance.toFixed(2)} $NTH`;
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
  
  // Initialize buy interface
  initBuyInterface();
  
  // Make functions available globally
  window.buyTokenHandler = {
    updatePriceDisplay,
    updateBuyTotal,
    updateSellTotal,
    updateSwapEstimate,
    updateTokenBalance
  };
});