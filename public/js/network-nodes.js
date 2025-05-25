/**
 * Basic Network Node Visualization
 * A simplified implementation for The Nothing App
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Get canvas container
  const container = document.getElementById('network-canvas-container');
  if (!container) {
    console.error('Network canvas container not found');
    return;
  }
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.className = 'node-canvas';
  container.appendChild(canvas);
  
  // Get canvas context
  const ctx = canvas.getContext('2d');
  
  // Log for debugging
  console.log('Canvas created with dimensions:', canvas.width, 'x', canvas.height);
  
  // Set canvas size to match container
  // Use a timer to ensure the container has been properly rendered
  setTimeout(() => {
    // Set fixed dimensions to ensure nodes are visible
    canvas.width = Math.max(container.offsetWidth, 800);
    canvas.height = Math.max(container.offsetHeight, 500);
    console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
    
    // Force redraw of nodes
    animate();
  }, 100);
  
  // Handle window resize with better visibility
  window.addEventListener('resize', function() {
    // Use maximum dimensions to ensure visibility
    canvas.width = Math.max(container.offsetWidth, 800);
    canvas.height = Math.max(container.offsetHeight, 500);
    console.log('Canvas resized after window resize:', canvas.width, 'x', canvas.height);
    
    // Recenter nodes to stay visible after resize
    for (const node of nodes) {
      // Keep nodes within canvas bounds
      if (node.x < node.radius * 2) node.x = node.radius * 2;
      if (node.x > canvas.width - node.radius * 2) node.x = canvas.width - node.radius * 2;
      if (node.y < node.radius * 2) node.y = node.radius * 2;
      if (node.y > canvas.height - node.radius * 2) node.y = canvas.height - node.radius * 2;
      
      // Keep welcome node at center
      if (node.isWelcome) {
        node.x = canvas.width / 2;
        node.y = canvas.height / 2;
      }
    }
  });
  
  // Node data with welcome nodes for new users
  const nodes = [];
  const connections = [];
  
  // Add a special welcome node for new users
  let welcomeNodeId = 0;
  
  // Create nodes representing real users in the network
  // Simulated recently active users (in a live environment, this would come from the database)
  const activeUsers = [
    { address: '0x9b710EAa56B1a7D45f12C9c642D8CeE766405489', lastActive: Date.now() - 1000 * 60 }, // 1 minute ago
    { address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', lastActive: Date.now() - 1000 * 60 * 5 }, // 5 minutes ago
    { address: '0x8fD00f170FDf3772C5ebdCD90bF257316c69BA45', lastActive: Date.now() - 1000 * 60 * 15 }, // 15 minutes ago
    { address: '0x19dE91Af973F404EDF5B4c093983a7c6E3EC8ccE', lastActive: Date.now() - 1000 * 60 * 45 }, // 45 minutes ago
    { address: '0x617F2E2fD72FD9D5503197092aC168c91465E7f2', lastActive: Date.now() - 1000 * 60 * 120 }, // 2 hours ago
  ];
  
  // Add network hub as the central node
  const isNetworkHub = true;
  welcomeNodeId = 0;
  nodes.push({
    id: 0,
    address: '0xNetworkHubNode',
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    color: '#8A2BE2', // Same purple but larger
    vx: 0, // Static position
    vy: 0,
    pulse: Math.random() * Math.PI * 2,
    tokenBalance: 5000,
    tokensBurned: 0,
    isWelcome: true,
    isHub: true,
    connectedUsers: activeUsers.length
  });
  
  // Add active user nodes
  for (let i = 0; i < activeUsers.length; i++) {
    // Calculate position based on time since active (more recent = closer to hub)
    const timeAgoFactor = Math.min(1, (Date.now() - activeUsers[i].lastActive) / (1000 * 60 * 60 * 3)); // Max 3 hours
    const distance = 80 + timeAgoFactor * 150; // Distance from center
    const angle = (i / activeUsers.length) * Math.PI * 2; // Distribute in a circle
    
    const x = canvas.width / 2 + Math.cos(angle) * distance;
    const y = canvas.height / 2 + Math.sin(angle) * distance;
    
    // Add node
    nodes.push({
      id: i + 1,
      address: activeUsers[i].address,
      x: x,
      y: y,
      radius: 8 + (1 - timeAgoFactor) * 3, // Larger for more recent activity
      color: '#8A2BE2',
      vx: (Math.random() - 0.5) * 0.2, // Slow drift
      vy: (Math.random() - 0.5) * 0.2,
      pulse: Math.random() * Math.PI * 2,
      tokenBalance: Math.floor(Math.random() * 1000),
      tokensBurned: Math.floor(Math.random() * 100),
      lastActive: activeUsers[i].lastActive,
      isWelcome: false
    });
  }
  
  // Add some additional nodes (other network participants)
  for (let i = 0; i < 9; i++) {
    // Generate random wallet address
    const address = '0x' + Array.from({length: 40}, () => 
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');
    
    // Randomize position but keep within visible area
    const x = Math.random() * canvas.width * 0.7 + canvas.width * 0.15;
    const y = Math.random() * canvas.height * 0.7 + canvas.height * 0.15;
    
    nodes.push({
      id: activeUsers.length + 1 + i,
      address: address,
      x: x,
      y: y,
      radius: 6 + Math.random() * 3,
      color: '#8A2BE2',
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      pulse: Math.random() * Math.PI * 2,
      tokenBalance: Math.floor(Math.random() * 500),
      tokensBurned: Math.floor(Math.random() * 50),
      lastActive: Date.now() - Math.random() * 1000 * 60 * 60 * 24, // Up to 24 hours ago
      isWelcome: false
    });
  }
  
  // Create realistic connections between users and the hub
  // First connect all active users to the network hub (star topology)
  for (let i = 1; i <= activeUsers.length; i++) {
    // Connection from hub to active user
    connections.push({
      from: 0, // Hub node ID
      to: i,   // Active user node ID
      health: 0.7 + Math.random() * 0.3, // Good connection to active users (0.7-1.0)
      lastActivity: nodes[i].lastActive, // Same as user's last activity
      latency: 20 + Math.floor(Math.random() * 80) // 20-100ms latency
    });
  }
  
  // Connect some active users to each other (peer connections)
  for (let i = 1; i <= activeUsers.length; i++) {
    // Each active user connects to 1-2 other active users
    const connectionCount = 1 + Math.floor(Math.random() * 2);
    
    for (let j = 0; j < connectionCount; j++) {
      let targetId = 1 + Math.floor(Math.random() * activeUsers.length);
      
      // Avoid self-connections and duplicates
      while (targetId === i || connections.some(c => 
        (c.from === i && c.to === targetId) || (c.from === targetId && c.to === i)
      )) {
        targetId = 1 + Math.floor(Math.random() * activeUsers.length);
      }
      
      // Calculate health based on activity time (more recent = better health)
      const timeDiff = Math.abs(nodes[i].lastActive - nodes[targetId].lastActive);
      const healthFactor = Math.max(0.3, 1 - (timeDiff / (1000 * 60 * 60 * 2))); // Time difference affects health
      
      connections.push({
        from: i,
        to: targetId,
        health: healthFactor,
        lastActivity: Math.max(nodes[i].lastActive, nodes[targetId].lastActive),
        latency: 50 + Math.floor(Math.random() * 150) // Peer connections have higher latency (50-200ms)
      });
    }
  }
  
  // Connect hub to some other network participants
  for (let i = activeUsers.length + 1; i < nodes.length; i++) {
    // 80% chance of connecting to hub
    if (Math.random() < 0.8) {
      connections.push({
        from: 0, // Hub
        to: i,   // Other participant
        health: 0.3 + Math.random() * 0.5, // More variable health (0.3-0.8)
        lastActivity: nodes[i].lastActive,
        latency: 100 + Math.floor(Math.random() * 100) // 100-200ms latency
      });
    }
    
    // Connect to 0-2 random nodes
    const connectionCount = Math.floor(Math.random() * 3);
    for (let j = 0; j < connectionCount; j++) {
      let targetId;
      // 50% chance to connect to an active user, 50% to another participant
      if (Math.random() < 0.5 && activeUsers.length > 0) {
        targetId = 1 + Math.floor(Math.random() * activeUsers.length);
      } else {
        targetId = activeUsers.length + 1 + Math.floor(Math.random() * (nodes.length - activeUsers.length - 1));
        // Avoid self-connections
        if (targetId === i) continue;
      }
      
      // Avoid duplicate connections
      if (connections.some(c => 
        (c.from === i && c.to === targetId) || (c.from === targetId && c.to === i)
      )) {
        continue;
      }
      
      connections.push({
        from: i,
        to: targetId,
        health: 0.2 + Math.random() * 0.6, // Very variable health (0.2-0.8)
        lastActivity: Math.min(nodes[i].lastActive, nodes[targetId].lastActive),
        latency: 100 + Math.floor(Math.random() * 150) // 100-250ms latency
      });
    }
  }
  
  // Animation variables
  let hoveredNode = null;
  let selectedNode = null;
  
  // Add mouse move event listener
  canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if mouse is over any node
    hoveredNode = null;
    for (const node of nodes) {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < node.radius * 1.5) {
        hoveredNode = node;
        canvas.style.cursor = 'pointer';
        break;
      }
    }
    
    if (!hoveredNode) {
      canvas.style.cursor = 'default';
    }
  });
  
  // Add click event listener
  canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if clicked on any node
    for (const node of nodes) {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < node.radius * 1.5) {
        selectedNode = node;
        updateNodeInfo(node);
        return;
      }
    }
    
    // If clicked elsewhere, deselect node
    selectedNode = null;
    hideNodeInfo();
  });
  
  // Create node info panel
  const infoPanel = document.createElement('div');
  infoPanel.className = 'node-info-panel hidden';
  infoPanel.innerHTML = `
    <h3 class="node-info-title">Node Details</h3>
    <div class="node-info-content">
      <p>Select a node to see details</p>
    </div>
  `;
  container.appendChild(infoPanel);
  
  // Function to update node info panel
  function updateNodeInfo(node) {
    const content = infoPanel.querySelector('.node-info-content');
    
    // Special handling for network hub node
    if (node.isWelcome) {
      content.innerHTML = `
        <div class="welcome-message">
          <h3 style="margin-bottom: 10px;">Network Hub Status</h3>
          <p>Central node connecting all users in the network</p>
          <div class="node-info-item">
            <span class="node-info-label">Network ID</span>
            <span class="node-info-value">Avalanche L1 - Main</span>
          </div>
          
          <div class="node-stats">
            <div class="node-stat-item">
              <span class="node-stat-value">${node.tokenBalance?.toFixed(2) || "100.00"}</span>
              <span class="node-stat-label">$NTH Balance</span>
            </div>
            
            <div class="node-stat-item">
              <span class="node-stat-value">${nodes.length - 1}</span>
              <span class="node-stat-label">Connected Users</span>
            </div>
            
            <div class="node-stat-item">
              <span class="node-stat-value">${connections.length}</span>
              <span class="node-stat-label">Total Connections</span>
            </div>
          </div>
          
          <div class="node-info-item">
            <span class="node-info-label">Recently Active Users</span>
            <div style="font-size: 0.8rem; margin-top: 5px;">
              ${activeUsers.map((user, i) => 
                `<div style="margin-bottom: 3px;">${user.address.substring(0, 6)}...${user.address.substring(user.address.length - 4)}</div>`
              ).join('')}
            </div>
          </div>
        </div>
      `;
      infoPanel.classList.remove('hidden');
      return;
    }
    
    // For regular nodes
    // Format address for display
    const shortAddress = node.address.substring(0, 8) + '...' + 
      node.address.substring(node.address.length - 6);
    
    // Get node connections
    const nodeConnections = connections.filter(
      conn => conn.from === node.id || conn.to === node.id
    );
    
    // Calculate average connection health
    let totalHealth = 0;
    let healthyConnections = 0;
    let warningConnections = 0;
    let criticalConnections = 0;
    
    nodeConnections.forEach(conn => {
      totalHealth += conn.health;
      
      if (conn.health > 0.8) {
        healthyConnections++;
      } else if (conn.health > 0.4) {
        warningConnections++;
      } else {
        criticalConnections++;
      }
    });
    
    const avgHealth = nodeConnections.length > 0 ? 
      (totalHealth / nodeConnections.length * 100).toFixed(0) : 0;
    
    // Generate health indicator HTML
    let healthIndicator;
    if (avgHealth > 80) {
      healthIndicator = `<span class="health-indicator healthy">${avgHealth}%</span>`;
    } else if (avgHealth > 40) {
      healthIndicator = `<span class="health-indicator warning">${avgHealth}%</span>`;
    } else {
      healthIndicator = `<span class="health-indicator critical">${avgHealth}%</span>`;
    }
    
    content.innerHTML = `
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
          <span class="node-stat-value">${nodeConnections.length}</span>
          <span class="node-stat-label">Connections</span>
        </div>
      </div>
      
      <div class="node-info-item">
        <span class="node-info-label">Network Health</span>
        <div class="health-bar-container">
          ${healthIndicator}
          <div class="health-bar">
            <div class="health-bar-fill" style="width: ${avgHealth}%"></div>
          </div>
        </div>
      </div>
      
      <div class="connection-summary">
        <div class="connection-type healthy">
          <span class="connection-count">${healthyConnections}</span>
          <span class="connection-label">Healthy</span>
        </div>
        <div class="connection-type warning">
          <span class="connection-count">${warningConnections}</span>
          <span class="connection-label">Warning</span>
        </div>
        <div class="connection-type critical">
          <span class="connection-count">${criticalConnections}</span>
          <span class="connection-label">Critical</span>
        </div>
      </div>
      
      <div class="node-info-item">
        <span class="node-info-label">Last Activity</span>
        <span class="node-info-value">Recently</span>
      </div>
    `;
    
    infoPanel.classList.remove('hidden');
  }
  
  // Function to hide node info panel
  function hideNodeInfo() {
    infoPanel.classList.add('hidden');
  }
  
  // Animation loop with performance optimization
  let lastFrameTime = 0;
  function animate(timestamp) {
    // Calculate delta time for smoother animation regardless of frame rate
    const deltaTime = lastFrameTime ? (timestamp - lastFrameTime) / 16.67 : 1; // normalized to 60fps
    lastFrameTime = timestamp;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update node positions with delta time for consistent motion
    for (const node of nodes) {
      // Apply simple physics with delta time for smoother motion
      node.x += node.vx * deltaTime * 0.8; // Slightly slower movement for better aesthetics
      node.y += node.vy * deltaTime * 0.8;
      
      // Bounce off edges with soft boundary
      const boundaryForce = 0.1;
      if (node.x < node.radius * 2) {
        node.vx += boundaryForce * deltaTime;
      } else if (node.x > canvas.width - node.radius * 2) {
        node.vx -= boundaryForce * deltaTime;
      }
      
      if (node.y < node.radius * 2) {
        node.vy += boundaryForce * deltaTime;
      } else if (node.y > canvas.height - node.radius * 2) {
        node.vy -= boundaryForce * deltaTime;
      }
      
      // Apply a small drag force for more natural movement
      node.vx *= 0.99;
      node.vy *= 0.99;
      
      // Add tiny random movement for more organic feel
      if (Math.random() < 0.05) { // Only occasionally
        node.vx += (Math.random() - 0.5) * 0.02;
        node.vy += (Math.random() - 0.5) * 0.02;
      }
      
      // Update pulse at consistent rate
      node.pulse += 0.015 * deltaTime;
      if (node.pulse > Math.PI * 2) {
        node.pulse -= Math.PI * 2;
      }
    }
    
    // Draw connections with health indicators
    for (const conn of connections) {
      const fromNode = nodes[conn.from];
      const toNode = nodes[conn.to];
      
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only draw connections within a certain distance
      if (distance < 200) {
        // Draw the main connection line
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        
        // Simpler connection colors for better performance
        let connectionColor;
        if (conn.health > 0.8) {
          // Healthy - subtle blue
          connectionColor = 'rgba(100, 149, 237, ';
        } else if (conn.health > 0.4) {
          // Medium - light blue
          connectionColor = 'rgba(135, 206, 250, ';
        } else {
          // Unhealthy - gray-blue
          connectionColor = 'rgba(176, 196, 222, ';
        }
        
        // Highlight connections for selected node
        if (selectedNode && (conn.from === selectedNode.id || conn.to === selectedNode.id)) {
          ctx.strokeStyle = connectionColor + '0.8)';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = connectionColor + '0.5)';
          ctx.lineWidth = 1;
        }
        
        ctx.stroke();
        
        // Draw health indicator at the midpoint of the connection
        const midX = fromNode.x + dx * 0.5;
        const midY = fromNode.y + dy * 0.5;
        
        // Draw health indicator circle
        ctx.beginPath();
        ctx.arc(midX, midY, 4, 0, Math.PI * 2);
        ctx.fillStyle = connectionColor + '0.9)';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Add pulse effect to health indicator based on activity
        const timeSinceActivity = Date.now() - conn.lastActivity;
        const pulseRate = Math.max(0.5, Math.min(2, 1000 / conn.latency)); // Faster pulse for lower latency
        
        if (timeSinceActivity < 3600000) { // Within the last hour
          const pulse = Math.sin(Date.now() * 0.005 * pulseRate) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(midX, midY, 4 + pulse * 3, 0, Math.PI * 2);
          ctx.fillStyle = connectionColor + '0.2)';
          ctx.fill();
        }
        
        // Draw particles on selected connections or occasionally on random connections
        if ((selectedNode && (conn.from === selectedNode.id || conn.to === selectedNode.id)) || 
            (Math.random() < 0.3 && conn.health > 0.7)) { // Only 30% chance for non-selected connections
          
          // Fewer particles for better performance
          const particleCount = Math.min(2, Math.floor(distance / 70));
          
          for (let i = 0; i < particleCount; i++) {
            // Particle speed depends on connection health and latency
            const particleSpeed = 0.8 + (1 - conn.latency/200) * 0.3; // Slightly slower for smoother animation
            const t = ((Date.now() * particleSpeed / 1000) + (i / particleCount)) % 1;
            
            const x = fromNode.x + dx * t;
            const y = fromNode.y + dy * t;
            
            // Smaller, more subtle particles
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = connectionColor + '0.9)';
            ctx.fill();
          }
        }
      }
    }
    
    // Draw nodes
    for (const node of nodes) {
      // Draw pulse effect with more visibility
      const pulseSize = 1 + 0.3 * Math.sin(node.pulse);
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * pulseSize * 1.5, 0, Math.PI * 2);
      
      // Simpler, more subtle glow
      const pulseOpacity = 0.15 + Math.sin(node.pulse) * 0.08;
      ctx.fillStyle = `rgba(120, 120, 180, ${pulseOpacity})`;
      ctx.fill();
      
      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      
      // Simpler highlight colors for smoother performance
      if (node === hoveredNode || node === selectedNode) {
        ctx.fillStyle = '#6495ED'; // Cornflower blue - more neutral
        ctx.shadowBlur = 5; // Less intense shadow for better performance
        ctx.shadowColor = 'rgba(100, 149, 237, 0.5)';
      } else {
        // Distinguish between user node, welcome node, and other nodes
        if (node.isCurrentUser) {
          ctx.fillStyle = '#4169E1'; // RoyalBlue for current user's node
        } else if (node.isWelcome) {
          ctx.fillStyle = '#4682B4'; // SteelBlue for hub
        } else {
          ctx.fillStyle = '#5F9EA0'; // CadetBlue for others
        }
        ctx.shadowBlur = 0;
      }
      
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow
      
      // Show address for hovered node
      if (node === hoveredNode) {
        if (node.isWelcome) {
          // Central node shows active users count
          ctx.font = 'bold 12px Arial';
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.fillText('Active Users: 15', node.x, node.y - node.radius * 2.5);
          ctx.font = '11px Arial';
          ctx.fillStyle = '#CCCCCC';
          ctx.fillText('Click to view network stats', node.x, node.y - node.radius * 1.5);
        } else {
          // Normal address display
          const shortAddr = node.address.substring(0, 6) + '...' + 
            node.address.substring(node.address.length - 4);
          
          ctx.font = '12px Arial';
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.fillText(shortAddr, node.x, node.y - node.radius * 2);
        }
      }
      
      // Always show the central node label
      if (node.isWelcome && node !== hoveredNode) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('Network Hub', node.x, node.y - node.radius * 1.5);
      }
    }
    
    // Continue animation
    requestAnimationFrame(animate);
  }
  
  // Make nodes and connections available globally to add new nodes when users connect
  window.nodes = nodes;
  window.connections = connections;
  
  // Add event listener for wallet connections
  document.addEventListener('wallet-connected', (event) => {
    if (event.detail && event.detail.address) {
      // Check if this wallet already has a node
      const existingNode = nodes.find(node => node.address === event.detail.address);
      if (!existingNode) {
        // Create a new node
        const newNodeId = nodes.length;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Position around center with some randomness
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 120;
        
        const newNode = {
          id: newNodeId,
          address: event.detail.address,
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          radius: 7 + Math.random() * 2,
          color: '#5F9EA0', // CadetBlue - simple color
          vx: (Math.random() - 0.5) * 0.1, // Slower initial velocity
          vy: (Math.random() - 0.5) * 0.1,
          pulse: Math.random() * Math.PI * 2,
          tokenBalance: 100,
          tokensBurned: 0,
          lastActive: Date.now(),
          isWelcome: false,
          isActive: true
        };
        
        // Add to nodes array
        nodes.push(newNode);
        
        // Connect to hub (node 0)
        connections.push({
          from: 0,
          to: newNodeId,
          health: 0.9,
          lastActivity: Date.now(),
          latency: 25 + Math.floor(Math.random() * 40)
        });
        
        // Connect to 1-2 random other nodes
        const connectionCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < connectionCount; i++) {
          const targetId = 1 + Math.floor(Math.random() * (nodes.length - 2));
          if (targetId !== newNodeId) {
            connections.push({
              from: newNodeId,
              to: targetId,
              health: 0.7 + Math.random() * 0.3,
              lastActivity: Date.now(),
              latency: 40 + Math.floor(Math.random() * 80)
            });
          }
        }
        
        console.log(`Added new node for wallet ${event.detail.address}`);
      }
    }
  });
  
  // Start animation with timestamp parameter for delta time calculation
  requestAnimationFrame(animate);
  
  console.log('Network node visualization initialized');
});