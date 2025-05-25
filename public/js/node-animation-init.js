/**
 * Node Animation Initialization
 * Sets up the interactive node connection animation for The Nothing App
 */

// Global reference to the network animation
let networkAnimation = null;

// Initialize the node animation when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initNodeAnimation();
});

// Initialize the node animation with dynamic data
function initNodeAnimation() {
  // Get the canvas element
  const canvas = document.getElementById('node-animation-canvas');
  if (!canvas) {
    console.error('Node animation canvas not found');
    return;
  }
  
  // Create the network animation
  networkAnimation = new NetworkAnimation('node-animation-canvas');
  
  // Set up the node selection handler
  networkAnimation.onNodeSelected = handleNodeSelection;
  
  // Use demo data directly
  console.log('Initializing node animation with demo data');
  
  // Start the animation with empty nodes array
  // The NetworkAnimation class will create demo nodes internally
  networkAnimation.initialize([]);
  
  // Start the animation
  networkAnimation.start();
  
  // Add window resize event listener to handle canvas resizing
  window.addEventListener('resize', () => {
    if (networkAnimation) {
      networkAnimation.resizeCanvas();
    }
  });
  
  // Set up animation controls
  setupAnimationControls();
}

// Generate initial nodes for the animation
function generateInitialNodes() {
  // Initialize with empty array and let the demo data be created
  networkAnimation.initialize([]);
}

// Handle node selection
function handleNodeSelection(node) {
  // Update the node info panel
  if (node) {
    updateNodeInfoPanel(node);
    showNodeInfoPanel();
  } else {
    hideNodeInfoPanel();
  }
}

// Update the node info panel with node details
function updateNodeInfoPanel(node) {
  const panel = document.getElementById('node-info-panel');
  if (!panel) return;
  
  const content = panel.querySelector('.node-info-content');
  if (!content) return;
  
  // Format address for display
  const shortAddress = `${node.address.substring(0, 8)}...${node.address.substring(node.address.length - 6)}`;
  
  // Format last activity time
  const lastActivity = new Date(node.lastActivityTime);
  const timeAgo = getTimeAgo(lastActivity);
  
  // Build the HTML for the node info
  const html = `
    <div class="node-info-item">
      <span class="node-info-label">Address</span>
      <span class="node-info-value">${shortAddress}</span>
    </div>
    
    <div class="node-stats">
      <div class="node-stat-item">
        <span class="node-stat-value">${node.tokenBalance.toFixed(2)}</span>
        <span class="node-stat-label">NTH Balance</span>
      </div>
      
      <div class="node-stat-item">
        <span class="node-stat-value">${node.tokensBurned.toFixed(2)}</span>
        <span class="node-stat-label">Burned</span>
      </div>
      
      <div class="node-stat-item">
        <span class="node-stat-value">${node.connections.length}</span>
        <span class="node-stat-label">Connections</span>
      </div>
    </div>
    
    <div class="node-info-item">
      <span class="node-info-label">Last Activity</span>
      <span class="node-info-value">${timeAgo}</span>
    </div>
    
    <div class="node-actions">
      <button class="node-action-btn" onclick="focusOnNode(${node.id})">Focus</button>
      <button class="node-action-btn" onclick="connectToNode(${node.id})">Connect</button>
    </div>
  `;
  
  content.innerHTML = html;
}

// Show the node info panel
function showNodeInfoPanel() {
  const panel = document.getElementById('node-info-panel');
  if (panel) {
    panel.classList.remove('hidden');
  }
}

// Hide the node info panel
function hideNodeInfoPanel() {
  const panel = document.getElementById('node-info-panel');
  if (panel) {
    panel.classList.add('hidden');
  }
}

// Focus the view on a specific node
function focusOnNode(nodeId) {
  if (!networkAnimation) return;
  
  const node = networkAnimation.nodes.find(n => n.id === nodeId);
  if (!node) return;
  
  // Add a visual highlight effect
  node.isSelected = true;
  networkAnimation.selectedNode = node;
  
  // Could add camera/viewport centering here if we implement that feature
}

// Connect the current user to a node
function connectToNode(nodeId) {
  if (!networkAnimation || !state.currentUser) return;
  
  // Find the current user's node
  const userNode = networkAnimation.nodes.find(n => 
    n.address && n.address.toLowerCase() === state.currentUser.address.toLowerCase()
  );
  
  if (!userNode) return;
  
  // Find the target node
  const targetNode = networkAnimation.nodes.find(n => n.id === nodeId);
  if (!targetNode) return;
  
  // Add connection if it doesn't already exist
  if (!userNode.connections.includes(targetNode.id)) {
    userNode.connections.push(targetNode.id);
    
    // Update the node info panel
    if (networkAnimation.selectedNode) {
      updateNodeInfoPanel(networkAnimation.selectedNode);
    }
    
    // Show a success message if the function exists
    if (typeof showTokenMessage === 'function') {
      showTokenMessage('Connection established with node');
    } else {
      console.log('Connection established with node');
    }
  }
}

// Set up animation controls
function setupAnimationControls() {
  // Add animation controls below the canvas
  const container = document.getElementById('network-canvas-container');
  if (!container) return;
  
  // Create controls element
  const controls = document.createElement('div');
  controls.className = 'animation-controls';
  controls.innerHTML = `
    <button class="animation-control-btn" id="add-node-btn">Add Node</button>
    <div class="animation-slider-container">
      <input type="range" min="0" max="100" value="50" class="animation-slider" id="connection-distance-slider">
    </div>
    <button class="animation-control-btn" id="reset-view-btn">Reset View</button>
  `;
  
  // Append controls after the canvas
  container.appendChild(controls);
  
  // Set up event handlers for controls
  document.getElementById('add-node-btn').addEventListener('click', addRandomNode);
  document.getElementById('reset-view-btn').addEventListener('click', resetView);
  
  // Connection distance slider
  const slider = document.getElementById('connection-distance-slider');
  slider.addEventListener('input', (e) => {
    // Update the connection distance based on slider value
    nodeAnimConfig.connectionDistance = 50 + parseInt(e.target.value) * 2;
  });
}

// Add a random node to the network
function addRandomNode() {
  if (!networkAnimation) return;
  
  // Generate a random wallet address
  const address = '0x' + Array.from({length: 40}, () => 
    '0123456789abcdef'[Math.floor(Math.random() * 16)]
  ).join('');
  
  // Random position
  const x = Math.random() * networkAnimation.canvas.width;
  const y = Math.random() * networkAnimation.canvas.height;
  
  // Add the node
  const newNode = networkAnimation.addNode({
    id: networkAnimation.nodes.length,
    address: address,
    x: x,
    y: y,
    lastActivity: Date.now(),
    tokenBalance: Math.floor(Math.random() * 1000),
    tokensBurned: Math.floor(Math.random() * 100),
    connections: []
  });
  
  // Connect to a random existing node
  if (networkAnimation.nodes.length > 1) {
    const randomNodeIndex = Math.floor(Math.random() * (networkAnimation.nodes.length - 1));
    const randomNode = networkAnimation.nodes[randomNodeIndex];
    
    newNode.connections.push(randomNode.id);
  }
  
  // Show a message if the function exists
  if (typeof showTokenMessage === 'function') {
    showTokenMessage('New node added to the network');
  } else {
    console.log('New node added to the network');
  }
}

// Reset the view
function resetView() {
  if (!networkAnimation) return;
  
  // Clear selection
  if (networkAnimation.selectedNode) {
    networkAnimation.selectedNode.isSelected = false;
    networkAnimation.selectedNode = null;
  }
  
  // Hide the info panel
  hideNodeInfoPanel();
  
  // Redistribute nodes
  networkAnimation.redistributeNodes();
}

// Helper function to get human-readable time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : interval + ' years ago';
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : interval + ' months ago';
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : interval + ' days ago';
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : interval + ' hours ago';
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : interval + ' minutes ago';
  }
  
  return seconds < 10 ? 'just now' : seconds + ' seconds ago';
}

// Add network nodes when a user connects their wallet
document.addEventListener('wallet-connected', (event) => {
  if (networkAnimation && event.detail && event.detail.address) {
    // Add the user as a node if not already present
    const existingNode = networkAnimation.nodes.find(
      node => node.address.toLowerCase() === event.detail.address.toLowerCase()
    );
    
    if (!existingNode) {
      const centerX = networkAnimation.canvas.width / 2;
      const centerY = networkAnimation.canvas.height / 2;
      
      // Add user node
      networkAnimation.addNode({
        id: networkAnimation.nodes.length,
        address: event.detail.address,
        x: centerX,
        y: centerY,
        lastActivity: Date.now(),
        tokenBalance: 100,
        tokensBurned: 0,
        connections: []
      });
    }
  }
});