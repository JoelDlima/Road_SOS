# Real-Time Responder Tracking

## Overview
Track emergency responders (ambulances, police) in real-time on the map.

## Architecture
- **WebSocket / Socket.IO** connection to a tracking server
- **expo-task-manager** for background location updates
- **react-native-maps** AnimatedMarker for live position rendering

## Implementation Plan
1. Set up a lightweight WebSocket server (Node.js + Socket.IO)
2. Create a `useResponderTracking` hook that connects to WS
3. Subscribe to location updates via `expo-location` (background)
4. Publish user location to WS when SOS is active
5. Subscribe to responder positions and render as map markers
6. Show ETA estimates based on Haversine distance

## API Design
```
WS Message: { type: 'responder_location', responderId, lat, lng, eta }
WS Message: { type: 'sos_alert', incidentId, lat, lng, userId }
```
