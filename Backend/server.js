const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CodeCouncil WebSocket server is running' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Data structures
const rooms = new Map();
const clients = new Map();

// Demo data for ALPHA-4291
const DEMO_DATA = {
  messages: [
    {
      id: 1,
      userName: 'Arjun',
      avatarColor: '#10B981',
      content: 'Hey checking the new function. Need to optimize the loop',
      timestamp: '10:42 AM'
    },
    {
      id: 2,
      userName: 'Priya',
      avatarColor: '#F59E0B',
      content: 'I think line 42 has a typo: const result = processData(input)',
      timestamp: '10:45 AM'
    },
    {
      id: 3,
      userName: 'CodeCouncil AI',
      avatarColor: '#8B5CF6',
      content: 'Detected memory leak in fetchUser. Refactor?',
      timestamp: 'Just now',
      type: 'ai'
    }
  ],
  files: {
    'authController.js': `const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};`,
    'styles.css': `/* Global styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #1a1a1a;
  color: #ffffff;
}`,
    'index.html': `<!DOCTYPE html>
<html>
<head>
  <title>CodeCouncil</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
  },
  snapshots: [
    {
      id: 1,
      label: 'v1 · Clean',
      fileName: 'authController.js',
      content: `const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({ token });
};`
    },
    {
      id: 2,
      label: 'v2 · Bug',
      fileName: 'authController.js',
      content: `const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  // BUG: No password verification!
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({ token });
};`
    },
    {
      id: 3,
      label: 'v3 · Debug',
      fileName: 'authController.js',
      content: `const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email); // DEBUG
  const user = await User.findOne({ email });
  console.log('User found:', user); // DEBUG
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({ token });
};`
    },
    {
      id: 4,
      label: 'v4 · Patch',
      fileName: 'authController.js',
      content: `const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({ token });
};`
    },
    {
      id: 5,
      label: 'v5 · Fixed ✓',
      fileName: 'authController.js',
      content: `const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};`
    }
  ]
};

// Helper: Get all users in a room
function getRoomUsers(roomId) {
  const users = [];
  clients.forEach((clientData, ws) => {
    if (clientData.roomId === roomId) {
      users.push({
        userName: clientData.userName,
        avatarColor: clientData.avatarColor
      });
    }
  });
  return users;
}

// Helper: Broadcast to all clients in a room
function broadcastToRoom(roomId, message, excludeWs = null) {
  clients.forEach((clientData, ws) => {
    if (clientData.roomId === roomId && ws !== excludeWs && ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'JOIN_ROOM': {
          const { roomId, userName, avatarColor } = message;

          // Create room if it doesn't exist
          if (!rooms.has(roomId)) {
            const roomData = {
              id: roomId,
              name: roomId,
              messages: [],
              files: {},
              snapshots: []
            };

            // Inject demo data for ALPHA-4291
            if (roomId === 'ALPHA-4291') {
              roomData.messages = [...DEMO_DATA.messages];
              roomData.files = { ...DEMO_DATA.files };
              roomData.snapshots = [...DEMO_DATA.snapshots];
            }

            rooms.set(roomId, roomData);
          }

          // Add client to clients map
          clients.set(ws, { roomId, userName, avatarColor });

          const room = rooms.get(roomId);
          const users = getRoomUsers(roomId);

          // Send room state to the joining client
          ws.send(JSON.stringify({
            type: 'ROOM_STATE',
            messages: room.messages,
            files: room.files,
            snapshots: room.snapshots,
            users: users
          }));

          // Broadcast user joined to others in the room
          broadcastToRoom(roomId, {
            type: 'USER_JOINED',
            userName: userName,
            users: users
          }, ws);

          break;
        }

        case 'SEND_MESSAGE': {
          const { roomId, userName, avatarColor, content } = message;
          const room = rooms.get(roomId);

          if (room) {
            const newMessage = {
              id: room.messages.length + 1,
              userName,
              avatarColor,
              content,
              timestamp: new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            };

            room.messages.push(newMessage);

            // Broadcast to ALL clients in room including sender
            broadcastToRoom(roomId, {
              type: 'NEW_MESSAGE',
              message: newMessage
            });

            // Also send to sender
            ws.send(JSON.stringify({
              type: 'NEW_MESSAGE',
              message: newMessage
            }));
          }

          break;
        }

        case 'UPDATE_FILE': {
          const { roomId, fileName, content } = message;
          const room = rooms.get(roomId);

          if (room) {
            room.files[fileName] = content;

            // Broadcast to room
            broadcastToRoom(roomId, {
              type: 'FILE_UPDATED',
              fileName,
              content
            });
          }

          break;
        }

        case 'SAVE_SNAPSHOT': {
          const { roomId, fileName, content, label } = message;
          const room = rooms.get(roomId);

          if (room) {
            const snapshot = {
              id: room.snapshots.length + 1,
              label,
              fileName,
              content
            };

            room.snapshots.push(snapshot);

            // Broadcast to room
            broadcastToRoom(roomId, {
              type: 'SNAPSHOT_SAVED',
              snapshot
            });
          }

          break;
        }

        case 'CREATE_FILE': {
          const { roomId, fileName } = message;
          const room = rooms.get(roomId);

          if (room) {
            room.files[fileName] = '';

            // Broadcast to room
            broadcastToRoom(roomId, {
              type: 'FILE_CREATED',
              fileName
            });
          }

          break;
        }

        case 'DELETE_FILE': {
          const { roomId, fileName } = message;
          const room = rooms.get(roomId);

          if (room) {
            delete room.files[fileName];

            // Broadcast to room
            broadcastToRoom(roomId, {
              type: 'FILE_DELETED',
              fileName
            });
          }

          break;
        }

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    const clientData = clients.get(ws);

    if (clientData) {
      const { roomId, userName } = clientData;

      // Remove client from clients map
      clients.delete(ws);

      // Get updated user list
      const users = getRoomUsers(roomId);

      // Broadcast user left to room
      broadcastToRoom(roomId, {
        type: 'USER_LEFT',
        userName,
        users
      });

      console.log(`User ${userName} left room ${roomId}`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});


// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`CodeCouncil WS running on port ${PORT}`);
});
