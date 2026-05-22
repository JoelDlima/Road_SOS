const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const HEARTBEAT_INTERVAL = 30000;

function heartbeat() {
  this.isAlive = true;
}

const PORT = process.env.PORT || 8080;
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Do not use the default in production.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const wss = new WebSocketServer({ port: PORT });

// Store connected responders and active SOS sessions
const responders = new Map(); // ws -> { id, name, lat, lng, type }
const activeSessions = new Map(); // incidentId -> { userId, lat, lng, contacts }

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

console.log(`RoadSoS Responder Server running on port ${PORT}`);

wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  if (!token) {
    ws.close(4001, 'Authentication required');
    return;
  }
  try {
    ws.user = jwt.verify(token, JWT_SECRET);
  } catch {
    ws.close(4001, 'Invalid token');
    return;
  }

  const id = uuidv4().slice(0, 8);
  console.log(`Client connected: ${id}`);

  ws.isAlive = true;
  ws.on('pong', heartbeat);

  ws.on('message', (raw) => {
    try {
      if (!checkRateLimit(ws)) return;

      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'register-responder':
          responders.set(ws, {
            id,
            name: msg.name || 'Unknown Responder',
            lat: msg.lat,
            lng: msg.lng,
            type: msg.responderType || 'ambulance',
          });
          // Notify all active SOS sessions
          activeSessions.forEach((session, incidentId) => {
            ws.send(JSON.stringify({
              type: 'sos-active',
              incidentId,
              lat: session.lat,
              lng: session.lng,
              userId: session.userId,
              timestamp: Date.now(),
            }));
          });
          break;

        case 'update-location':
          const responder = responders.get(ws);
          if (responder) {
            responder.lat = msg.lat;
            responder.lng = msg.lng;
            // Broadcast to all connected clients
            wss.clients.forEach((client) => {
              if (client.readyState === 1) {
                client.send(JSON.stringify({
                  type: 'responder-location',
                  responderId: responder.id,
                  name: responder.name,
                  lat: msg.lat,
                  lng: msg.lng,
                  responderType: responder.type,
                  timestamp: Date.now(),
                }));
              }
            });
          }
          break;

        case 'sos-triggered':
          activeSessions.set(msg.incidentId, {
            userId: msg.userId,
            lat: msg.lat,
            lng: msg.lng,
            contacts: msg.contacts || [],
            timestamp: Date.now(),
          });
          // Broadcast to all responders
          wss.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'sos-active',
                incidentId: msg.incidentId,
                lat: msg.lat,
                lng: msg.lng,
                userId: msg.userId,
                timestamp: Date.now(),
              }));
            }
          });
          break;

        case 'sos-resolved':
          activeSessions.delete(msg.incidentId);
          wss.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'sos-resolved',
                incidentId: msg.incidentId,
              }));
            }
          });
          break;
      }
    } catch (err) {
      console.error('Invalid message:', err.message);
    }
  });

  ws.on('close', () => {
    responders.delete(ws);
    console.log(`Client disconnected: ${id}`);
  });

  // Send welcome with assigned ID
  ws.send(JSON.stringify({ type: 'welcome', responderId: id }));
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
  console.log('Shutting down gracefully...');
  clearInterval(interval);
  wss.close(() => {
    console.log('All connections closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.log('Forcing shutdown after timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

console.log('Waiting for connections...');
