const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

// Initialize Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : null;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://nothing-app.firebaseio.com"
  });
} else {
  console.warn('Firebase service account not provided. Firebase functionality will be limited.');
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory node storage (backup in case Firebase is not available)
let nodes = [];

// WebSocket connections
const clients = new Set();

// WebSocket server
wss.on('connection', (ws) => {
  // Add client to set
  clients.add(ws);
  
  // Send existing nodes to new client
  ws.send(JSON.stringify({
    type: 'nodes',
    data: nodes
  }));
  
  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'new_node') {
        // Add new node to storage
        nodes.push(data.node);
        
        // Broadcast new node to all clients
        broadcastNode(data.node);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Broadcast node to all connected clients
function broadcastNode(node) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'new_node',
        node
      }));
    }
  });
}

// API Routes
app.get('/api/nodes', (req, res) => {
  res.json(nodes);
});

app.post('/api/nodes', (req, res) => {
  const { address, x, y } = req.body;
  
  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }
  
  const newNode = {
    address: address.toLowerCase(),
    x,
    y,
    timestamp: Date.now()
  };
  
  // Add to in-memory storage
  nodes.push(newNode);
  
  // Add to Firebase if available
  if (admin.apps.length) {
    const db = admin.database();
    db.ref(`nodes/${address.toLowerCase()}`).set(newNode);
  }
  
  // Broadcast to WebSocket clients
  broadcastNode(newNode);
  
  res.status(201).json(newNode);
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Sync with Firebase on startup if available
if (admin.apps.length) {
  const db = admin.database();
  db.ref('nodes').once('value', (snapshot) => {
    nodes = [];
    snapshot.forEach((childSnapshot) => {
      nodes.push(childSnapshot.val());
    });
    console.log(`Synced ${nodes.length} nodes from Firebase`);
  });
  
  // Listen for Firebase changes
  db.ref('nodes').on('child_added', (snapshot) => {
    const node = snapshot.val();
    broadcastNode(node);
  });
}
