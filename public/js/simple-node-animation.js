/**
 * Simple Node Network Animation for The Nothing App
 */

class SimpleNodeAnimation {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container ${containerId} not found`);
      return;
    }
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'node-canvas';
    this.container.appendChild(this.canvas);
    
    // Set up canvas
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    
    // Animation properties
    this.nodes = [];
    this.connections = [];
    this.animationFrame = null;
    this.hoverNode = null;
    this.selectedNode = null;
    
    // Create info panel
    this.infoPanel = document.createElement('div');
    this.infoPanel.className = 'node-info-panel hidden';
    this.infoPanel.innerHTML = `
      <h3 class="node-info-title">Node Details</h3>
      <div class="node-info-content">
        <p>Select a node to see details</p>
      </div>
    `;
    this.container.appendChild(this.infoPanel);
    
    // Add event listeners
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    
    // Generate nodes
    this.generateNodes(20);
    
    // Start animation
    this.animate();
  }
  
  resize() {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight || 400;
    
    // Reposition nodes if needed
    if (this.nodes.length > 0) {
      this.nodes.forEach(node => {
        if (node.x > this.canvas.width) node.x = this.canvas.width * 0.8;
        if (node.y > this.canvas.height) node.y = this.canvas.height * 0.8;
      });
    }
  }
  
  generateNodes(count) {
    const colorOptions = [
      '#8A2BE2', // Purple
      '#4A90E2', // Blue
      '#50E3C2', // Teal
      '#F5A623', // Orange
      '#D0021B'  // Red
    ];
    
    for (let i = 0; i < count; i++) {
      // Generate random wallet address
      const address = '0x' + Array.from({length: 40}, () => 
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
      
      // Create node
      this.nodes.push({
        id: i,
        address: address,
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: 8 + Math.random() * 4,
        color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
        tokenBalance: Math.floor(Math.random() * 1000),
        tokensBurned: Math.floor(Math.random() * 200),
        lastActivity: Date.now() - Math.random() * 1000000 * 50
      });
    }
    
    // Generate some random connections
    for (let i = 0; i < count * 1.5; i++) {
      const nodeA = Math.floor(Math.random() * count);
      let nodeB = Math.floor(Math.random() * count);
      
      // Ensure not connecting to self
      while (nodeB === nodeA) {
        nodeB = Math.floor(Math.random() * count);
      }
      
      this.connections.push({
        source: nodeA,
        target: nodeB,
        strength: 0.5 + Math.random() * 0.5
      });
    }
  }
  
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if mouse is over any node
    let hoveredNode = null;
    for (const node of this.nodes) {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < node.radius * 1.5) {
        hoveredNode = node;
        break;
      }
    }
    
    // Update cursor and hover state
    this.canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
    this.hoverNode = hoveredNode;
  }
  
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if clicked on a node
    let clickedNode = null;
    for (const node of this.nodes) {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < node.radius * 1.5) {
        clickedNode = node;
        break;
      }
    }
    
    // Update selected node
    if (clickedNode) {
      this.selectedNode = clickedNode;
      this.updateInfoPanel(clickedNode);
      this.infoPanel.classList.remove('hidden');
    } else {
      this.selectedNode = null;
      this.infoPanel.classList.add('hidden');
    }
  }
  
  updateInfoPanel(node) {
    if (!node) return;
    
    const content = this.infoPanel.querySelector('.node-info-content');
    const shortAddress = `${node.address.substring(0, 8)}...${node.address.substring(node.address.length - 6)}`;
    const timeAgo = this.getTimeAgo(new Date(node.lastActivity));
    
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
          <span class="node-stat-value">${this.getNodeConnections(node.id).length}</span>
          <span class="node-stat-label">Connections</span>
        </div>
      </div>
      
      <div class="node-info-item">
        <span class="node-info-label">Last Activity</span>
        <span class="node-info-value">${timeAgo}</span>
      </div>
    `;
  }
  
  getNodeConnections(nodeId) {
    return this.connections.filter(conn => 
      conn.source === nodeId || conn.target === nodeId
    );
  }
  
  animate() {
    this.update();
    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
  
  update() {
    const maxSpeed = 0.5;
    const friction = 0.97;
    const repulsion = 0.2;
    const attraction = 0.05;
    
    // Update node positions and apply forces
    for (let i = 0; i < this.nodes.length; i++) {
      const nodeA = this.nodes[i];
      
      // Apply repulsion between nodes
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeB = this.nodes[j];
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const force = repulsion / Math.max(10, distance);
          const forceX = dx / distance * force;
          const forceY = dy / distance * force;
          
          nodeA.vx -= forceX;
          nodeA.vy -= forceY;
          nodeB.vx += forceX;
          nodeB.vy += forceY;
        }
      }
      
      // Apply attraction for connected nodes
      for (const conn of this.connections) {
        if (conn.source === nodeA.id || conn.target === nodeA.id) {
          const other = this.nodes[conn.source === nodeA.id ? conn.target : conn.source];
          
          const dx = other.x - nodeA.x;
          const dy = other.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 150) {
            const force = attraction * conn.strength;
            nodeA.vx += dx / distance * force;
            nodeA.vy += dy / distance * force;
          }
        }
      }
      
      // Apply boundary forces
      const margin = 50;
      if (nodeA.x < margin) nodeA.vx += 0.1;
      if (nodeA.x > this.canvas.width - margin) nodeA.vx -= 0.1;
      if (nodeA.y < margin) nodeA.vy += 0.1;
      if (nodeA.y > this.canvas.height - margin) nodeA.vy -= 0.1;
      
      // Apply friction
      nodeA.vx *= friction;
      nodeA.vy *= friction;
      
      // Limit speed
      const speed = Math.sqrt(nodeA.vx * nodeA.vx + nodeA.vy * nodeA.vy);
      if (speed > maxSpeed) {
        nodeA.vx = (nodeA.vx / speed) * maxSpeed;
        nodeA.vy = (nodeA.vy / speed) * maxSpeed;
      }
      
      // Update position
      nodeA.x += nodeA.vx;
      nodeA.y += nodeA.vy;
      
      // Update pulse phase
      nodeA.pulsePhase += 0.05;
      if (nodeA.pulsePhase > Math.PI * 2) {
        nodeA.pulsePhase -= Math.PI * 2;
      }
    }
  }
  
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw connections
    this.ctx.lineWidth = 1;
    for (const conn of this.connections) {
      const sourceNode = this.nodes[conn.source];
      const targetNode = this.nodes[conn.target];
      
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only draw if nodes are within maximum distance
      if (distance < 200) {
        // Calculate opacity based on distance
        const opacity = 1 - (distance / 200);
        
        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(sourceNode.x, sourceNode.y);
        this.ctx.lineTo(targetNode.x, targetNode.y);
        this.ctx.strokeStyle = `rgba(138, 43, 226, ${opacity * 0.5})`;
        this.ctx.stroke();
        
        // Draw particles along connection for selected/hovered nodes
        if (this.selectedNode && 
            (conn.source === this.selectedNode.id || conn.target === this.selectedNode.id)) {
          this.drawParticles(sourceNode, targetNode, distance);
        }
      }
    }
    
    // Draw nodes
    for (const node of this.nodes) {
      // Calculate pulse effect
      const pulseValue = Math.sin(node.pulsePhase) * 0.5 + 0.5;
      const pulseScale = 1 + pulseValue * 0.5;
      const pulseOpacity = 0.2 + pulseValue * 0.3;
      
      // Draw pulse effect
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius * pulseScale * 1.5, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(138, 43, 226, ${pulseOpacity})`;
      this.ctx.fill();
      
      // Draw node
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = node.color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Highlight if selected or hovered
      if ((this.selectedNode && node.id === this.selectedNode.id) ||
          (this.hoverNode && node.id === this.hoverNode.id)) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius * 1.3, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Show node address on hover
        if (this.hoverNode && node.id === this.hoverNode.id) {
          const shortAddress = `${node.address.substring(0, 6)}...${node.address.substring(node.address.length - 4)}`;
          this.ctx.font = '12px Arial';
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(shortAddress, node.x, node.y - node.radius * 2);
        }
      }
    }
  }
  
  drawParticles(sourceNode, targetNode, distance) {
    const particleCount = Math.min(5, Math.floor(distance / 30));
    const time = performance.now() / 1000;
    
    this.ctx.fillStyle = '#FFFFFF';
    
    for (let i = 0; i < particleCount; i++) {
      const t = ((time + (i / particleCount)) % 1);
      
      const x = sourceNode.x + (targetNode.x - sourceNode.x) * t;
      const y = sourceNode.y + (targetNode.y - sourceNode.y) * t;
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  // Helper function to format time ago
  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval === 1 ? '1 year ago' : `${interval} years ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval === 1 ? '1 month ago' : `${interval} months ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? '1 day ago' : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
    }
    
    return seconds < 10 ? 'just now' : `${seconds} seconds ago`;
  }
  
  // Clean up
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('click', this.handleClick);
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Initialize the animation system
function initializeNodeAnimation() {
  // Find network canvas container
  const container = document.getElementById('network-canvas-container');
  if (container) {
    console.log('Initializing simple node animation');
    window.nodeAnimation = new SimpleNodeAnimation('network-canvas-container');
    return true;
  } else {
    console.error('Network canvas container not found');
    return false;
  }
}

// Try to initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Give the browser time to render the container
  setTimeout(() => {
    if (!initializeNodeAnimation()) {
      // If failed, try again after a short delay
      setTimeout(initializeNodeAnimation, 1000);
    }
  }, 100);
});

// Also try to initialize when window loads (backup)
window.addEventListener('load', () => {
  if (!window.nodeAnimation) {
    initializeNodeAnimation();
  }
});