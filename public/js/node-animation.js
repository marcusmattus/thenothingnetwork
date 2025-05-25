/**
 * Interactive Node Connection Animation
 * Provides dynamic visualization of connected nodes in The Nothing App network
 */

// Configuration for node animations
const nodeAnimConfig = {
  // Node appearance
  nodeRadius: 12,
  nodeBorderWidth: 2,
  nodeColor: '#8A2BE2',
  nodeBorderColor: '#FFFFFF',
  
  // Connection appearance
  connectionWidth: 1.5,
  connectionColor: 'rgba(138, 43, 226, 0.6)',
  connectionActiveColor: 'rgba(138, 43, 226, 1.0)',
  connectionDistance: 150, // Maximum distance to draw connections
  
  // Animation
  pulseFrequency: 1.5, // seconds
  pulseMaxScale: 1.5,
  pulseMinOpacity: 0.2,
  
  // Data flow animation
  particleSize: 3,
  particleColor: '#FFFFFF',
  particleSpeed: 50, // pixels per second
  
  // Interaction
  hoverScale: 1.2,
  selectedScale: 1.3,
  
  // Simulation parameters
  simulationStrength: 0.1,
  gravity: 0.05,
  friction: 0.92
};

// Node class to represent each network participant
class Node {
  constructor(id, address, x, y, data = {}) {
    this.id = id;
    this.address = address;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = nodeAnimConfig.nodeRadius;
    this.pulsePhase = Math.random() * Math.PI * 2; // Random starting phase
    this.lastActivityTime = data.lastActivity || Date.now();
    this.tokenBalance = data.tokenBalance || 0;
    this.tokensBurned = data.tokensBurned || 0;
    this.connections = []; // Array of connected nodes
    this.isHovered = false;
    this.isSelected = false;
    this.scale = 1;
    this.opacity = 1;
  }

  // Update node animation state
  update(deltaTime) {
    // Update position based on velocity
    this.x += this.vx * deltaTime;
    this.vy += nodeAnimConfig.gravity * deltaTime; // Add slight gravity
    this.y += this.vy * deltaTime;
    
    // Apply friction
    this.vx *= nodeAnimConfig.friction;
    this.vy *= nodeAnimConfig.friction;
    
    // Update pulse animation
    this.pulsePhase += deltaTime * (Math.PI * 2) / nodeAnimConfig.pulseFrequency;
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase -= Math.PI * 2;
    }
    
    // Calculate pulse scale and opacity
    const pulseValue = Math.sin(this.pulsePhase) * 0.5 + 0.5; // 0 to 1
    this.pulseScale = 1 + pulseValue * (nodeAnimConfig.pulseMaxScale - 1);
    this.pulseOpacity = nodeAnimConfig.pulseMinOpacity + pulseValue * (1 - nodeAnimConfig.pulseMinOpacity);
    
    // Handle hovering and selection animations
    if (this.isHovered && this.scale < nodeAnimConfig.hoverScale) {
      this.scale += deltaTime * 5;
      if (this.scale > nodeAnimConfig.hoverScale) this.scale = nodeAnimConfig.hoverScale;
    } else if (this.isSelected && this.scale < nodeAnimConfig.selectedScale) {
      this.scale += deltaTime * 5;
      if (this.scale > nodeAnimConfig.selectedScale) this.scale = nodeAnimConfig.selectedScale;
    } else if (!this.isHovered && !this.isSelected && this.scale > 1) {
      this.scale -= deltaTime * 5;
      if (this.scale < 1) this.scale = 1;
    }
  }
  
  // Draw the node on the canvas
  draw(ctx) {
    ctx.save();
    
    // Draw pulse effect
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * this.pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(138, 43, 226, ${this.pulseOpacity * 0.3})`;
    ctx.fill();
    
    // Draw node
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * this.scale, 0, Math.PI * 2);
    ctx.fillStyle = nodeAnimConfig.nodeColor;
    ctx.fill();
    ctx.lineWidth = nodeAnimConfig.nodeBorderWidth;
    ctx.strokeStyle = nodeAnimConfig.nodeBorderColor;
    ctx.stroke();
    
    // Draw address text for hovered/selected nodes
    if (this.isHovered || this.isSelected) {
      ctx.font = '12px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      // Format address for display (truncate)
      const displayAddress = `${this.address.substring(0, 6)}...${this.address.substring(this.address.length - 4)}`;
      ctx.fillText(displayAddress, this.x, this.y - this.radius * this.scale - 5);
    }
    
    ctx.restore();
  }
  
  // Draw connections to other nodes
  drawConnections(ctx, nodes) {
    for (const node of nodes) {
      if (node.id === this.id) continue; // Skip self
      
      // Calculate distance between nodes
      const dx = node.x - this.x;
      const dy = node.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only draw connections within the maximum distance
      if (distance < nodeAnimConfig.connectionDistance) {
        // Calculate opacity based on distance (closer = more opaque)
        const opacity = 1 - (distance / nodeAnimConfig.connectionDistance);
        
        // Draw connection line
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = `rgba(138, 43, 226, ${opacity * 0.6})`;
        ctx.lineWidth = nodeAnimConfig.connectionWidth;
        ctx.stroke();
        
        // If this is a connection with data flow, draw particles
        if (this.connections.includes(node.id) || node.connections.includes(this.id)) {
          this.drawParticles(ctx, node, distance, dx, dy);
        }
      }
    }
  }
  
  // Draw data flow particles along connections
  drawParticles(ctx, node, distance, dx, dy) {
    // Use node IDs to seed a consistent animation
    const seed = (this.id * 10000 + node.id) % 1000;
    const time = performance.now() / 1000;
    
    // Determine number of particles based on distance
    const particleCount = Math.max(1, Math.floor(distance / 30));
    
    for (let i = 0; i < particleCount; i++) {
      // Calculate position along the line with time-based animation
      const t = ((time * nodeAnimConfig.particleSpeed / distance) + (i / particleCount) + (seed / 1000)) % 1;
      
      const particleX = this.x + dx * t;
      const particleY = this.y + dy * t;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(particleX, particleY, nodeAnimConfig.particleSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * Math.sin(t * Math.PI)})`;
      ctx.fill();
    }
  }
  
  // Check if the mouse position is over this node
  isPointInside(x, y) {
    const dx = this.x - x;
    const dy = this.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.radius * this.scale;
  }
}

// NetworkAnimation class to manage the overall visualization
class NetworkAnimation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas element with ID '${canvasId}' not found`);
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.selectedNode = null;
    this.hoveredNode = null;
    this.isRunning = false;
    this.lastFrameTime = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    
    // Resize canvas to match container
    this.resizeCanvas();
    
    // Set up event listeners
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e), { passive: false });
  }
  
  // Initialize the animation with a set of nodes
  initialize(initialNodes = []) {
    this.nodes = [];
    
    // Create nodes from initial data if provided
    if (initialNodes && initialNodes.length > 0) {
      const canvasWidth = this.canvas ? this.canvas.width : 800;
      const canvasHeight = this.canvas ? this.canvas.height : 500;
      
      for (const nodeData of initialNodes) {
        const x = nodeData.x || Math.random() * canvasWidth;
        const y = nodeData.y || Math.random() * canvasHeight;
        
        const node = new Node(
          nodeData.id,
          nodeData.address,
          x, y,
          {
            lastActivity: nodeData.lastActivity,
            tokenBalance: nodeData.tokenBalance,
            tokensBurned: nodeData.tokensBurned
          }
        );
        
        // Add connections if provided
        if (nodeData.connections) {
          node.connections = [...nodeData.connections];
        }
        
        this.nodes.push(node);
      }
    } else {
      // Create demo nodes by default
      this.createDemoNodes();
    }
    
    // Start animation loop
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      requestAnimationFrame((timestamp) => this.animationLoop(timestamp));
    }
  }
  
  // Create random demo nodes for testing
  createDemoNodes() {
    const nodeCount = 20;
    const canvasWidth = this.canvas ? this.canvas.width : 800;
    const canvasHeight = this.canvas ? this.canvas.height : 500;
    
    for (let i = 0; i < nodeCount; i++) {
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      
      // Generate a random wallet address
      const address = '0x' + Array.from({length: 40}, () => 
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
      
      const node = new Node(i, address, x, y, {
        lastActivity: Date.now() - Math.random() * 1000000,
        tokenBalance: Math.floor(Math.random() * 1000),
        tokensBurned: Math.floor(Math.random() * 100)
      });
      
      // Add some random connections
      const connectionCount = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < connectionCount; j++) {
        const targetId = Math.floor(Math.random() * nodeCount);
        if (targetId !== i && !node.connections.includes(targetId)) {
          node.connections.push(targetId);
        }
      }
      
      this.nodes.push(node);
    }
  }
  
  // Resize canvas to match container dimensions
  resizeCanvas() {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    } else {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    
    // Reposition nodes to fit new dimensions
    this.redistributeNodes();
  }
  
  // Redistribute nodes when canvas size changes
  redistributeNodes() {
    if (this.nodes.length === 0) return;
    
    // Keep nodes within the canvas boundaries
    for (const node of this.nodes) {
      if (node.x < node.radius) node.x = node.radius;
      if (node.x > this.canvas.width - node.radius) node.x = this.canvas.width - node.radius;
      if (node.y < node.radius) node.y = node.radius;
      if (node.y > this.canvas.height - node.radius) node.y = this.canvas.height - node.radius;
    }
  }
  
  // Main animation loop
  animationLoop(timestamp) {
    if (!this.isRunning) return;
    
    // Calculate time difference since last frame
    const deltaTime = (timestamp - this.lastFrameTime) / 1000; // in seconds
    this.lastFrameTime = timestamp;
    
    // Make sure canvas is available
    if (!this.canvas || !this.ctx) {
      console.error('Canvas or context not available');
      return;
    }
    
    try {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Apply forces between nodes for dynamic layout
      this.applyForces(deltaTime);
      
      // Update and draw connections
      this.drawAllConnections();
      
      // Update and draw nodes
      for (const node of this.nodes) {
        node.update(deltaTime);
        node.draw(this.ctx);
      }
      
      // Draw hover tooltip if a node is hovered
      if (this.hoveredNode) {
        this.drawNodeTooltip(this.hoveredNode);
      }
      
      // Request next frame
      requestAnimationFrame((timestamp) => this.animationLoop(timestamp));
    } catch (error) {
      console.error('Error in animation loop:', error);
      // Still request next frame to try to recover
      requestAnimationFrame((timestamp) => this.animationLoop(timestamp));
    }
  }
  
  // Apply forces between nodes for dynamic positioning
  applyForces(deltaTime) {
    // Apply repulsive forces between all nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const nodeA = this.nodes[i];
      
      // Apply boundary forces to keep nodes within canvas
      this.applyBoundaryForces(nodeA);
      
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeB = this.nodes[j];
        
        // Calculate distance between nodes
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Skip if too far apart
        if (distance > 300) continue;
        
        // Normalized direction
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Base repulsive force (inverse square law)
        const force = nodeAnimConfig.simulationStrength * 100 / (distance * distance);
        
        // Apply repulsive force
        nodeA.vx -= nx * force * deltaTime;
        nodeA.vy -= ny * force * deltaTime;
        nodeB.vx += nx * force * deltaTime;
        nodeB.vy += ny * force * deltaTime;
        
        // If nodes are connected, apply attractive force
        if (nodeA.connections.includes(nodeB.id) || nodeB.connections.includes(nodeA.id)) {
          const attractiveForce = nodeAnimConfig.simulationStrength * distance * 0.01;
          nodeA.vx += nx * attractiveForce * deltaTime;
          nodeA.vy += ny * attractiveForce * deltaTime;
          nodeB.vx -= nx * attractiveForce * deltaTime;
          nodeB.vy -= ny * attractiveForce * deltaTime;
        }
      }
    }
  }
  
  // Apply forces to keep nodes within canvas boundaries
  applyBoundaryForces(node) {
    const margin = 50;
    const boundaryForce = 0.5;
    
    // Left boundary
    if (node.x < margin) {
      node.vx += boundaryForce * (margin - node.x) / margin;
    }
    
    // Right boundary
    if (node.x > this.canvas.width - margin) {
      node.vx -= boundaryForce * (node.x - (this.canvas.width - margin)) / margin;
    }
    
    // Top boundary
    if (node.y < margin) {
      node.vy += boundaryForce * (margin - node.y) / margin;
    }
    
    // Bottom boundary
    if (node.y > this.canvas.height - margin) {
      node.vy -= boundaryForce * (node.y - (this.canvas.height - margin)) / margin;
    }
  }
  
  // Draw all connections between nodes
  drawAllConnections() {
    // First draw regular connections
    for (const node of this.nodes) {
      node.drawConnections(this.ctx, this.nodes);
    }
    
    // Then draw highlighted connections if a node is selected
    if (this.selectedNode) {
      this.ctx.save();
      
      // Draw connections from selected node with highlighted style
      for (const node of this.nodes) {
        if (node.id === this.selectedNode.id) continue;
        
        if (this.selectedNode.connections.includes(node.id) || 
            node.connections.includes(this.selectedNode.id)) {
          
          // Calculate distance
          const dx = node.x - this.selectedNode.x;
          const dy = node.y - this.selectedNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Draw highlighted connection
          this.ctx.beginPath();
          this.ctx.moveTo(this.selectedNode.x, this.selectedNode.y);
          this.ctx.lineTo(node.x, node.y);
          this.ctx.strokeStyle = nodeAnimConfig.connectionActiveColor;
          this.ctx.lineWidth = nodeAnimConfig.connectionWidth * 2;
          this.ctx.stroke();
          
          // Draw more pronounced particles
          this.selectedNode.drawParticles(this.ctx, node, distance, dx, dy);
        }
      }
      
      this.ctx.restore();
    }
  }
  
  // Draw detailed tooltip for hovered node
  drawNodeTooltip(node) {
    const ctx = this.ctx;
    const padding = 10;
    const lineHeight = 20;
    
    // Calculate tooltip position
    const tooltipX = node.x + node.radius * 2 + padding;
    let tooltipY = node.y - 100;
    
    // Adjust if too close to the edge
    if (tooltipX + 200 > this.canvas.width) {
      tooltipX = node.x - 200 - node.radius * 2 - padding;
    }
    if (tooltipY < 0) {
      tooltipY = 10;
    }
    
    // Draw tooltip background
    ctx.save();
    ctx.fillStyle = 'rgba(30, 30, 42, 0.9)';
    ctx.strokeStyle = nodeAnimConfig.nodeColor;
    ctx.lineWidth = 1;
    roundRect(
      ctx, 
      tooltipX, 
      tooltipY, 
      200, 
      lineHeight * 5 + padding * 2, 
      5, 
      true, 
      true
    );
    
    // Draw tooltip content
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Format address
    const displayAddress = `${node.address.substring(0, 10)}...${node.address.substring(node.address.length - 8)}`;
    
    // Draw text lines
    ctx.fillText(`Address: ${displayAddress}`, tooltipX + padding, tooltipY + padding);
    ctx.fillText(`Balance: ${node.tokenBalance.toFixed(2)} NTH`, tooltipX + padding, tooltipY + padding + lineHeight);
    ctx.fillText(`Tokens Burned: ${node.tokensBurned.toFixed(2)} NTH`, tooltipX + padding, tooltipY + padding + lineHeight * 2);
    
    // Format last activity timestamp
    const lastActivity = new Date(node.lastActivityTime);
    const timeAgo = getTimeAgo(lastActivity);
    ctx.fillText(`Last Activity: ${timeAgo}`, tooltipX + padding, tooltipY + padding + lineHeight * 3);
    
    // Show connections count
    ctx.fillText(`Connections: ${node.connections.length}`, tooltipX + padding, tooltipY + padding + lineHeight * 4);
    
    ctx.restore();
  }
  
  // Handle mouse movement for node hovering
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
    
    // Reset previously hovered node
    if (this.hoveredNode) {
      this.hoveredNode.isHovered = false;
      this.hoveredNode = null;
    }
    
    // Check if mouse is over any node
    for (const node of this.nodes) {
      if (node.isPointInside(this.mouseX, this.mouseY)) {
        node.isHovered = true;
        this.hoveredNode = node;
        this.canvas.style.cursor = 'pointer';
        break;
      }
    }
    
    // Reset cursor if not hovering any node
    if (!this.hoveredNode) {
      this.canvas.style.cursor = 'default';
    }
  }
  
  // Handle mouse clicks for node selection
  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Reset previously selected node
    if (this.selectedNode) {
      this.selectedNode.isSelected = false;
    }
    
    // Check if click is on any node
    let clickedNode = null;
    for (const node of this.nodes) {
      if (node.isPointInside(clickX, clickY)) {
        clickedNode = node;
        break;
      }
    }
    
    // If clicked on a node, select it
    if (clickedNode) {
      // If clicking the same node, deselect it
      if (this.selectedNode === clickedNode) {
        this.selectedNode = null;
      } else {
        clickedNode.isSelected = true;
        this.selectedNode = clickedNode;
      }
      
      // Trigger a custom event
      if (typeof this.onNodeSelected === 'function') {
        this.onNodeSelected(clickedNode);
      }
    } else {
      this.selectedNode = null;
    }
  }
  
  // Handle touch events for mobile
  handleTouch(event) {
    event.preventDefault();
    
    if (event.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touchX = event.touches[0].clientX - rect.left;
      const touchY = event.touches[0].clientY - rect.top;
      
      // Simulate mouse move
      this.mouseX = touchX;
      this.mouseY = touchY;
      
      // Reset previously hovered node
      if (this.hoveredNode) {
        this.hoveredNode.isHovered = false;
        this.hoveredNode = null;
      }
      
      // Check if touch is on any node
      for (const node of this.nodes) {
        if (node.isPointInside(touchX, touchY)) {
          node.isHovered = true;
          this.hoveredNode = node;
          
          // If this is a touchstart event, also handle selection
          if (event.type === 'touchstart') {
            // Reset previously selected node
            if (this.selectedNode) {
              this.selectedNode.isSelected = false;
            }
            
            // If tapping the same node, deselect it
            if (this.selectedNode === node) {
              this.selectedNode = null;
            } else {
              node.isSelected = true;
              this.selectedNode = node;
            }
            
            // Trigger a custom event
            if (typeof this.onNodeSelected === 'function') {
              this.onNodeSelected(node);
            }
          }
          
          break;
        }
      }
    }
  }
  
  // Add a new node to the visualization
  addNode(nodeData) {
    const x = nodeData.x || Math.random() * this.canvas.width;
    const y = nodeData.y || Math.random() * this.canvas.height;
    
    const newNode = new Node(
      nodeData.id || this.nodes.length,
      nodeData.address,
      x, y,
      {
        lastActivity: nodeData.lastActivity || Date.now(),
        tokenBalance: nodeData.tokenBalance || 0,
        tokensBurned: nodeData.tokensBurned || 0
      }
    );
    
    // Add connections if provided
    if (nodeData.connections) {
      newNode.connections = [...nodeData.connections];
    }
    
    this.nodes.push(newNode);
    return newNode;
  }
  
  // Add a connection between two nodes
  addConnection(sourceId, targetId) {
    // Find the source node
    const sourceNode = this.nodes.find(node => node.id === sourceId);
    if (!sourceNode) return false;
    
    // Check if the target node exists
    const targetExists = this.nodes.some(node => node.id === targetId);
    if (!targetExists) return false;
    
    // Add connection if it doesn't already exist
    if (!sourceNode.connections.includes(targetId)) {
      sourceNode.connections.push(targetId);
      return true;
    }
    
    return false;
  }
  
  // Remove a connection between two nodes
  removeConnection(sourceId, targetId) {
    // Find the source node
    const sourceNode = this.nodes.find(node => node.id === sourceId);
    if (!sourceNode) return false;
    
    // Remove connection if it exists
    const connectionIndex = sourceNode.connections.indexOf(targetId);
    if (connectionIndex !== -1) {
      sourceNode.connections.splice(connectionIndex, 1);
      return true;
    }
    
    return false;
  }
  
  // Stop the animation
  stop() {
    this.isRunning = false;
  }
  
  // Start or resume the animation
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      requestAnimationFrame((timestamp) => this.animationLoop(timestamp));
    }
  }
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  
  if (fill) {
    ctx.fill();
  }
  
  if (stroke) {
    ctx.stroke();
  }
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

// Export the NetworkAnimation class for use in the application
window.NetworkAnimation = NetworkAnimation;