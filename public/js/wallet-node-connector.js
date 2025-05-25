/**
 * Wallet-Node Connector
 * Connects wallet events to node visualization system
 */

// Keep track of connected wallets to avoid duplicate nodes
const connectedWallets = new Set();

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Wallet-Node connector initialized');
  
  // Listen for wallet connection events
  document.addEventListener('wallet-connected', function(event) {
    if (!event.detail || !event.detail.address) return;
    
    const walletAddress = event.detail.address;
    
    // Check if this wallet is already connected
    if (connectedWallets.has(walletAddress)) {
      console.log(`Wallet ${walletAddress} already has a node`);
      return;
    }
    
    // Add to connected wallets
    connectedWallets.add(walletAddress);
    
    // Add a new node to the visualization
    addNewWalletNode(walletAddress);
  });
});

/**
 * Add a new node to the visualization for a connected wallet
 * @param {string} walletAddress - The wallet address
 */
function addNewWalletNode(walletAddress) {
  // Wait a moment to ensure network visualization is initialized
  setTimeout(() => {
    try {
      // Get the canvas element to check if nodes are being rendered
      const canvas = document.getElementById('node-animation-canvas');
      if (!canvas) {
        console.log('Canvas not found, will retry later');
        setTimeout(() => addNewWalletNode(walletAddress), 1000);
        return;
      }
      
      // Access the global nodes array
      const nodesArray = window.nodes;
      if (!nodesArray) {
        console.log('Nodes array not found, creating a new node directly');
        addNodeDirectly(walletAddress);
        return;
      }
      
      // Check if this wallet already has a node
      const existingNode = nodesArray.find(node => node.address === walletAddress);
      if (existingNode) {
        console.log(`Node for wallet ${walletAddress} already exists`);
        return;
      }
      
      // Create a new node
      const newNodeId = nodesArray.length;
      
      // Position based on time connected (recent connections closer to center)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 150;
      
      const newNode = {
        id: newNodeId,
        address: walletAddress,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        radius: 8 + Math.random() * 3,
        color: '#4169E1', // RoyalBlue for user's own node
        isCurrentUser: true, // Mark as current user's node
        health: 0.95, // High health for current user
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        pulse: Math.random() * Math.PI * 2,
        tokenBalance: 100, // Default starting balance
        tokensBurned: 0,
        lastActive: Date.now(),
        isWelcome: false
      };
      
      // Add to nodes array
      nodesArray.push(newNode);
      
      // Connect to network hub (node 0)
      if (nodesArray.length > 1) {
        window.connections.push({
          from: 0, // Hub
          to: newNodeId,
          health: 0.9, // Start with good health
          lastActivity: Date.now(),
          latency: 20 + Math.floor(Math.random() * 50) // 20-70ms latency
        });
        
        // Connect to 1-2 random other nodes
        const connectionCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < connectionCount; i++) {
          let targetId = 1 + Math.floor(Math.random() * (nodesArray.length - 1));
          if (targetId !== newNodeId) {
            window.connections.push({
              from: newNodeId,
              to: targetId,
              health: 0.7 + Math.random() * 0.3, // Good health
              lastActivity: Date.now(),
              latency: 50 + Math.floor(Math.random() * 100) // 50-150ms latency
            });
          }
        }
      }
      
      console.log(`Added new node for wallet ${walletAddress}`);
    } catch (error) {
      console.error('Error adding wallet node:', error);
    }
  }, 500);
}

/**
 * Add a node directly by creating a new network visualization
 * @param {string} walletAddress - The wallet address
 */
function addNodeDirectly(walletAddress) {
  // This is a fallback if the nodes array isn't accessible
  console.log('Using fallback method to add node');
  
  // Try to access the canvas container
  const container = document.getElementById('network-canvas-container');
  if (!container) {
    console.error('Network canvas container not found');
    return;
  }
  
  // Dispatch an event that a new node has been added
  const event = new CustomEvent('node-added', {
    detail: {
      address: walletAddress,
      timestamp: Date.now()
    }
  });
  document.dispatchEvent(event);
}

// Make nodes array available globally for direct manipulation
window.connectedWallets = connectedWallets;