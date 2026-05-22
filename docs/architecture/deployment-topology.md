# RoadSoS Deployment Topology

## Overview

```
                                  ┌─────────────────────┐
                                  │     Cloudflare CDN   │
                                  │   (DNS + DDoS + SSL) │
                                  └──────────┬──────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
            ┌───────▼───────┐       ┌───────▼───────┐       ┌───────▼───────┐
            │   Supabase    │       │  Responder WS │       │    Vercel     │
            │  (Managed)    │       │ (Railway/Fly) │       │   (Edge)      │
            │               │       │               │       │               │
            │ ┌───────────┐ │       │ ┌───────────┐ │       │ ┌───────────┐ │
            │ │ Postgres  │ │       │ │ WebSocket │ │       │ │  Next.js  │ │
            │ │ + PostGIS │ │       │ │ Server    │ │       │ │ Dashboard │ │
            │ ├───────────┤ │       │ │ (port 8080)│ │       │ └───────────┘ │
            │ │ Auth      │ │       │ └───────────┘ │       └───────────────┘
            │ ├───────────┤ │       │               │
            │ │ Realtime  │ │       │ ┌───────────┐ │
            │ ├───────────┤ │       │ │ Signaling │ │
            │ │ Edge Fn   │ │       │ │ Server    │ │
            │ └───────────┘ │       │ │ (port 8081)│ │
            └───────────────┘       │ └───────────┘ │
                                    └───────────────┘
                                             │
                                    ┌───────▼───────┐
                                    │   EAS Build   │
                                    │  (Expo Auth)  │
                                    │               │
                                    │ ┌───────────┐ │
                                    │ │ Android   │ │
                                    │ │ APK/AAB   │ │
                                    │ ├───────────┤ │
                                    │ │ iOS IPA   │ │
                                    │ └───────────┘ │
                                    └───────────────┘
```

## Components

### 1. Supabase Cloud (Managed)

| Aspect | Detail |
|---|---|
| Provider | Supabase Platform (multi-region) |
| Database | PostgreSQL 15 + PostGIS 3 |
| Region | Singapore (ap-southeast-1) — closest to India |
| Services | Auth (GoTrue), Realtime (via websockets), Edge Functions (Deno) |
| Auto-scaling | Vertical scale on paid plans; connection pooling via PgBouncer |

**Data flow**: Mobile app connects directly via `@supabase/supabase-js` SDK. Dashboard connects via server-side client. Edge Functions handle Twilio SMS dispatch and webhook callbacks.

**Backup**: Daily automated backups with 7-day retention. Point-in-time recovery on Pro plan.

### 2. Responder Server — Railway / Fly.io

| Aspect | Detail |
|---|---|
| Provider | Railway (primary) / Fly.io (DR) |
| Runtime | Node.js 20+ |
| Services | WebSocket server (port 8080), Signaling server (port 8081) |
| Scaling | Horizontal — Railway auto-scales based on connection count |
| Persistence | None (stateless — rooms/sessions live in memory) |
| Health | Railway health checks on `/health` HTTP endpoint (to be added) |

**Scaling strategy**: Each server instance handles ~10,000 concurrent connections. Scale-out by adding Railway replicas. Session state is in-memory — on restart all rooms are lost. For production, consider: (a) sticky sessions, (b) Redis-backed session store, or (c) graceful shutdown with drain.

**WebRTC signaling**: The signaling server (port 8081) relays SDP offers/answers and ICE candidates between peers. No media passes through — it's peer-to-peer after negotiation.

### 3. Web Dashboard — Vercel

| Aspect | Detail |
|---|---|
| Provider | Vercel (Edge Network) |
| Framework | Next.js 14 |
| Deployment | `git push` → auto-deploy |
| Regions | Mumbai (edge) for Indian users |
| SSR | Server-rendered pages for incident monitoring |

**Dashboard features**: Real-time incident map (Leaflet), responder tracking via WebSocket, incident history, service management.

### 4. Mobile App — EAS Build

| Aspect | Detail |
|---|---|
| Provider | Expo Application Services (EAS) |
| Platform | Android (APK/AAB), iOS (IPA) |
| Distribution | EAS Submit → Play Store / App Store |
| Updates | EAS Update (over-the-air JS bundle updates) |
| CI | GitHub Actions → EAS Build on tag push |

**Build pipeline**: PR → GitHub Actions (lint + test) → merge to main → EAS Build → EAS Submit → Stores.

**OTA updates**: Critical fixes bypass store review via `expo-updates`. Native module changes require full build.

### 5. DNS & CDN

| Aspect | Detail |
|---|---|
| DNS | Cloudflare DNS (roadsos.in) |
| CDN | Cloudflare (static assets, dashboard caching) |
| DDoS | Cloudflare proxied (orange cloud) |
| SSL | Automatic (Cloudflare Origin CA + edge certs) |

**Domain layout**:
- `roadsos.in` → Dashboard (Vercel)
- `api.roadsos.in` → Supabase
- `ws.roadsos.in` → Responder WS (Railway)
- `signal.roadsos.in` → Signaling server (Railway)

---

## Scaling Strategy

### Phase 1 (Launch — 10K users)
- Supabase free tier → Pro ($25/mo)
- 1 Railway instance (2 vCPU, 4GB RAM)
- Vercel Pro

### Phase 2 (Growth — 100K users)
- Supabase Pro with compute upgrade
- 2-3 Railway instances with Redis session store
- Vercel Pro with edge functions

### Phase 3 (Scale — 1M+ users)
- Supabase Enterprise or self-hosted PostgreSQL
- Kubernetes-based WebSocket fleet with auto-scaling
- Multi-region Supabase (Mumbai + Singapore)
- CDN offloading for static assets

---

## Disaster Recovery

| Scenario | RTO | RPO | Mitigation |
|---|---|---|---|
| Railway instance failure | < 30s | 0 | Auto-restart + health checks |
| Supabase region outage | < 5 min | < 5 min | Failover to read-replica |
| DB corruption | < 1 hr | 24 hr | Point-in-time recovery |
| Full cloud provider outage | < 4 hr | 24 hr | Manual DNS switch to Fly.io DR |
