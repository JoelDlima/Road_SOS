const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const HEARTBEAT_INTERVAL = 30000;

function heartbeat() {
  this.isAlive = true;
}

const PORT = process.env.SIGNALING_PORT || 8081;
const wss = new WebSocketServer({ port: PORT });

const rooms = new Map();

// Rate limiting state
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 1000;
const MAX_MESSAGES = 10;

function checkRateLimit(ws) {
  const now = Date.now();
  const record = rateLimit.get(ws) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT_WINDOW;
  }
  record.count++;
  rateLimit.set(ws, record);
  if (record.count > MAX_MESSAGES) {
    ws.close(4002, 'Rate limit exceeded');
    return false;
  }
  return true;
}

console.log(`RoadSoS Signaling Server running on port ${PORT}`);

wss.on('connection', (ws) => {
  const id = uuidv4().slice(0, 8);
  let currentRoom = null;

  ws.isAlive = true;
  ws.on('pong', heartbeat);

  ws.on('message', (raw) => {
    try {
      if (!checkRateLimit(ws)) return;

      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'join-room':
          currentRoom = msg.roomId;
          if (!rooms.has(currentRoom)) {
            rooms.set(currentRoom, new Set());
          }
          rooms.get(currentRoom).add(ws);

          rooms.get(currentRoom).forEach((client) => {
            if (client !== ws && client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'peer-joined',
                peerId: id,
              }));
            }
          });

          ws.send(JSON.stringify({
            type: 'room-joined',
            roomId: currentRoom,
            peerId: id,
            peerCount: rooms.get(currentRoom).size,
          }));
          break;

        case 'leave-room':
          if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom).delete(ws);
            if (rooms.get(currentRoom).size === 0) {
              rooms.delete(currentRoom);
            } else {
              rooms.get(currentRoom).forEach((client) => {
                if (client.readyState === 1) {
                  client.send(JSON.stringify({
                    type: 'peer-left',
                    peerId: id,
                  }));
                }
              });
            }
          }
          currentRoom = null;
          break;

        case 'offer':
        case 'answer':
        case 'ice-candidate':
          if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom).forEach((client) => {
              if (client !== ws && client.readyState === 1) {
                client.send(JSON.stringify({
                  ...msg,
                  senderId: id,
                }));
              }
            });
          }
          break;
      }
    } catch (err) {
      console.error('Signaling error:', err.message);
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(ws);
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
      } else {
        rooms.get(currentRoom).forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'peer-left',
              peerId: id,
            }));
          }
        });
      }
    }
  });
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => clearInterval(interval));

function gracefulShutdown() {
  console.log('Shutting down signaling server gracefully...');
  clearInterval(interval);
  wss.close(() => {
    console.log('All signaling connections closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.log('Forcing signaling server shutdown after timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

console.log('Signaling server ready');
