# RoadSoS Service Boundaries

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ┌───────────────────────┐                    │
│                    │    Mobile App (Expo)   │                    │
│                    │   (Presentation Layer) │                    │
│                    │                       │                    │
│  ┌─────────────┐  │  ┌─────────────────┐  │  ┌──────────────┐  │
│  │  SOS Engine  │  │  │  AI Assistant   │  │  │  Dashboard   │  │
│  │  (offline)   │  │  │  (Gemma/Groq)   │  │  │  (Web)       │  │
│  └──────┬───────┘  │  └─────────────────┘  │  └──────────────┘  │
│         │           │                       │                    │
│  ┌──────▼───────┐  │  ┌─────────────────┐  │                    │
│  │  Crash Detect│  │  │  Service Search  │  │                    │
│  │  (sensors)   │  │  │  (map/list)      │  │                    │
│  └──────────────┘  │  └─────────────────┘  │                    │
│                    └───────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐    ┌───────▼───────┐    ┌───────▼───────┐
│   Supabase    │    │  Responder    │    │  Signaling    │
│  (Data+Auth)  │◄──►│  Server (WS)  │    │  Server (WS)  │
│               │    │               │    │               │
│ ┌───────────┐ │    │ ┌───────────┐ │    │ ┌───────────┐ │
│ │ PostgreSQL│ │    │ │ SOS Relay │ │    │ │ WebRTC    │ │
│ │ + PostGIS │ │    │ ├───────────┤ │    │ │ Signaling │ │
│ ├───────────┤ │    │ │ Responder │ │    │ └───────────┘ │
│ │ Auth      │ │    │ │ Tracking  │ │    └───────────────┘
│ ├───────────┤ │    │ └───────────┘ │
│ │ Realtime  │ │    └───────────────┘
│ ├───────────┤ │
│ │ Edge Fn   │ │
│ └───────────┘ │
└───────────────┘
```

## Service Boundaries

### 1. Mobile App (Presentation Layer)

**Responsibility**: User interface, on-device processing, offline-first data management.

**Owns**:
- SOS alert triggering (manual + crash detection)
- On-device AI inference (Gemma via llama.rn)
- Local data persistence (AsyncStorage, SQLite for incidents)
- Accelerometer-based crash detection with configurable sensitivity
- SMS delivery via native device SMS API
- Emergency service cache (7-day TTL) + seed data
- User preferences and emergency contacts

**Does NOT own**:
- Real-time peer-to-peer video (delegated to WebRTC via signaling server)
- Responder location broadcast (subscribes via Responder Server WS)
- Persistent data storage beyond device lifecycle

**Tech stack**: Expo SDK 54, React Native 0.81, NativeWind, react-native-webrtc, expo-sms, expo-sensors, expo-notifications.

### 2. Responder Server (Real-Time Communication)

**Responsibility**: Relay SOS events to emergency responders, track responder locations in real-time.

**Owns**:
- WebSocket connection management for responders
- SOS event broadcasting (triggered → all responders)
- Responder location tracking and distribution
- Active SOS session registry (in-memory)
- `sos-triggered`, `sos-resolved`, `register-responder`, `update-location` message types

**Does NOT own**:
- WebRTC signaling (delegated to Signaling Server)
- Persistent storage (all state is ephemeral/in-memory)
- Authentication (relies on Supabase Auth tokens passed in-band)

**Tech stack**: Node.js, ws library, UUID.

**Message protocol**:

| Type | Direction | Payload |
|---|---|---|
| `register-responder` | Responder → Server | `{ name, lat, lng, responderType }` |
| `update-location` | Responder → Server | `{ lat, lng }` |
| `sos-triggered` | Mobile → Server | `{ incidentId, userId, lat, lng, contacts }` |
| `sos-resolved` | Mobile → Server | `{ incidentId }` |
| `responder-location` | Server → All | `{ responderId, name, lat, lng, responderType, timestamp }` |
| `sos-active` | Server → Responders | `{ incidentId, lat, lng, userId, timestamp }` |
| `sos-resolved` | Server → Responders | `{ incidentId }` |

### 3. Signaling Server (WebRTC Coordination)

**Responsibility**: Facilitate peer-to-peer WebRTC connections between mobile users and responders for video streaming.

**Owns**:
- Room-based connection management
- Relay of SDP offers/answers and ICE candidates
- Peer join/leave notifications
- Room lifecycle (creation, destruction when empty)

**Does NOT own**:
- Media streams (purely signaling — no media passes through)
- Responder discovery (relies on Responder Server for that)

**Tech stack**: Node.js, ws library, UUID.

### 4. Supabase (Data + Auth)

**Responsibility**: Persistent data storage, user authentication, spatial queries, real-time subscriptions, server-side logic.

**Owns**:

| Entity | Description |
|---|---|
| `services` | Emergency service listings with PostGIS geography column |
| `incidents` | SOS incident records with location, status, SMS delivery state |
| Auth Users | Email/password and OAuth identities via GoTrue |
| `nearby_services()` | PostGIS RPC for spatial radius search |
| Edge Functions | Twilio SMS dispatch, webhook receivers |

**Does NOT own**:
- Real-time responder locations (Responder Server owns this)
- WebRTC signaling (Signaling Server owns this)

**Tech stack**: PostgreSQL 15 + PostGIS, Supabase Auth, Deno Edge Functions.

### 5. Web Dashboard (Monitoring)

**Responsibility**: Provide a browser-based interface for emergency monitoring and incident management.

**Owns**:
- Real-time incident map with Leaflet
- Responder position overlay (via WebSocket subscription)
- Incident history browser and search
- Service database management UI
- User/responder administration

**Does NOT own**:
- SOS triggering or crash detection
- Any real-time communication with mobile devices (subscribes, never originates)

**Tech stack**: Next.js 14, React 18, Leaflet, react-leaflet, WebSocket client.

---

## Inter-Service Communication Matrix

| From \ To | Mobile App | Responder Server | Signaling Server | Supabase | Dashboard |
|---|---|---|---|---|---|
| **Mobile App** | — | WebSocket (SOS) | WebSocket (WebRTC) | REST/SDK | — |
| **Responder Server** | — | — | — | — | WebSocket |
| **Signaling Server** | WebSocket | — | — | — | — |
| **Supabase** | REST/SDK push | — | — | — | REST/SDK |
| **Dashboard** | — | WebSocket | — | REST/SDK | — |

---

## Failure Isolation

| Service Failure | Impact | Mitigation |
|---|---|---|
| Supabase down | No service search, no incident persistence | Offline cache + local storage; sync when back online |
| Responder Server down | No responder tracking, SOS not broadcast to responders | SOS still works via SMS; responders reconnect on restart |
| Signaling Server down | No WebRTC video calls | SOS + SMS still work; video gracefully degrades |
| Mobile app crash | Only that user affected | Crashlytics monitoring; SOS state restored on relaunch |
| Dashboard down | Web monitoring unavailable | Mobile app unaffected; incident data still flows |

---

## Scaling Boundaries

| Service | Scaling Unit | Bottleneck | Solution |
|---|---|---|---|
| Mobile App | Per device | Storage, battery | Offline-first, background task management |
| Responder Server | Per connection | Concurrent WS connections | Horizontal scale, Redis session store |
| Signaling Server | Per room | Rooms × peers | Stateless room management, horizontal scale |
| Supabase | Per query | PostGIS query load, connection count | PgBouncer, index optimization, read replicas |
| Dashboard | Per page view | SSR rendering, WS connections | Vercel edge, ISR for static pages |
