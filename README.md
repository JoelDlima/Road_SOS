# RoadSoS — AI-Powered Road Emergency Response Platform

> **AIEM Open Innovation Hackathon** · Emergency Response Track

---

## The Problem

Every year, **1.5 million people die on roads globally** — and a significant portion of those deaths are preventable. The critical window is the first 10 minutes after a crash. What happens in that window determines survival.

Today, that window is wasted:

- Crash victims are unconscious or in shock — they can't call for help
- Bystanders don't know who to call or where the nearest hospital is
- Emergency coordinators have no real-time visibility into what's happening on the road
- First responders arrive without knowing the patient's blood type or medical history
- Family members have no way to know if their loved one is safe

**The gap isn't technology — it's coordination.**

---

## Our Solution

**RoadSoS** is a full-stack emergency response platform that closes the coordination gap from crash detection to hospital arrival.

It works in two parts:

**Mobile App** (React Native) — rides silently in the driver's pocket. Uses the accelerometer to detect crashes automatically. The moment impact is detected, it starts a 12-second countdown. If the driver doesn't cancel, it fires an SOS: sends SMS to emergency contacts, logs the incident to the cloud, and begins broadcasting the driver's live location.

**Web Dashboard** (this repo) — the coordinator's command center. Emergency coordinators, hospitals, and traffic police see every incident the moment it happens. They can track responders on a live map, analyse crash hotspots, resolve incidents, and dispatch help — all from a browser.

Together, they turn a chaotic crash scene into a coordinated response.

---

## How It Solves the Problem

| Problem | RoadSoS Solution |
|---------|-----------------|
| Victim can't call for help | Auto-detection via accelerometer — no action needed |
| Coordinator has no visibility | Live dashboard with real-time incident feed |
| Responders don't know where to go | Live GPS tracking on map, auto-pan to new incidents |
| First responder doesn't know medical history | ICE Card QR — scan to see blood group instantly |
| Family doesn't know if driver is safe | Family Tracking Portal — share a 6-digit code |
| No app? Can't get help | Web SOS — anyone can trigger an alert from a browser |
| Crash patterns unknown | Heatmap + analytics — see where and when crashes cluster |
| False positives waste resources | Crash Severity Inspector — g-force data to tune detection |

---

## Features

### 🚨 Live Incident Command Center
Real-time incident feed powered by Supabase Realtime. New crashes appear instantly — no refresh. The active incident count is displayed at 72px so it hits you the moment you open the dashboard. Incidents are color-coded by trigger type (amber = auto-detected crash, blue = manual SOS). Only resolved incidents show a badge — silence means active.

### 🗺️ Live Tactical Map
Interactive Leaflet map centered on India with CartoDB Dark Matter tiles. Shows your live GPS location, incident markers (red dots), and responder positions (live-updating purple pins). Toggle between marker view and a **crash density heatmap** (blue → amber → red gradient) to see dangerous road stretches at a glance.

### 📊 Crash Analytics
Dedicated `/analytics` page with three charts:
- **Incidents per day** (last 30 days) — spot trends
- **Incidents by hour** — identify rush hour danger windows
- **Auto vs Manual ratio** — understand how crashes are being triggered

### 🔬 Crash Severity Inspector
Table view of the `crash_logs` table written by the mobile app. Shows g-force, jerk (g/s), sensitivity setting, detection mode, and outcome for every crash event. Color-coded: red = SOS sent, amber = cancelled (false positive), grey = pending. Sortable by G-Force. Lets coordinators tune the detection algorithm by seeing exactly which events triggered alerts.

### ✅ Incident Lifecycle Management
Coordinators can resolve incidents directly from the web — no need to touch the mobile app. Two-step resolve flow with an optional resolution note. Re-open button for incidents that need follow-up. Resolution timestamp recorded for response time analysis.

### 🆘 Web SOS — No App Required
Public page at `/sos`. Anyone — a passenger, a bystander, someone who borrowed a phone — can trigger an emergency alert from a browser. Browser GPS captures location automatically. Rate-limited to prevent abuse. Confirmation page with incident ID and live tracking link.

### 🏥 ICE Card QR Generator
Every incident detail page shows a QR code. Scan it to open a public, print-friendly medical card showing the driver's name and blood group. Designed to be printed and stuck on a dashboard or helmet — so first responders have critical medical info even when the phone is locked or damaged.

### 👨‍👩‍👧 Family Tracking Portal
Drivers share a 6-digit code with family. Family members visit `/track/family/XXXXXX` and see a live "Safe / Active Incident" status with the last known location on a map. Updates in real-time. No account needed for family members.

### 🏥 Emergency Services Registry
Admin CRUD for registering hospitals, ambulances, trauma centres, police stations, towing services, and more. Each service has GPS coordinates, phone number, 24×7 flag, and service type. The foundation for future nearest-service dispatch.

### 🌙 Dark / Light Mode
Toggle in the top-right of the nav. Light theme uses warm off-white (`#f0ede8`) — not blinding white. Map tiles switch between CartoDB Dark Matter and CartoDB Light. Persists across sessions.

### 🌐 7 Languages
English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi. URL-prefix routing (`/en/`, `/hi/`, `/ta/`, etc.).

---

## Demo

| Page | What to show |
|------|-------------|
| `/en/dashboard` | Live incident count, map with your location, red incident dots |
| Toggle Heatmap | Crash density overlay appears |
| `/en/analytics` | Daily/hourly charts, trigger ratio |
| `/en/admin/crash-logs` | G-force table, color-coded outcomes |
| `/en/track/[id]` | Resolve an incident, scan the QR code |
| `/en/sos` | Trigger a web SOS from the browser — no app needed |
| `/track/family/[code]` | Family member sees live Safe/Active status |

---

## Built With

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15 (App Router) | Server components, API routes, i18n routing |
| Database | Supabase (PostgreSQL + PostGIS) | Realtime, Auth, spatial queries |
| Realtime | Supabase Realtime | Sub-second incident updates without polling |
| Map | Leaflet + react-leaflet | Lightweight, customisable, works offline |
| Heatmap | leaflet.heat | Crash density visualisation |
| Charts | Recharts | Lightweight React-native charts |
| QR | qrcode.react | ICE card generation |
| Animations | Framer Motion | Incident row transitions |
| Deployment | Vercel | Edge-optimised, zero-config |

---

## Getting Started

```bash
git clone --branch web --single-branch https://github.com/Spacey6849/RoadSOS.git
cd RoadSOS
npm install
cp .env.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
```

**Environment variables needed:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DEFAULT_LANG=en
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Architecture

```
Mobile App (React Native)
    │  accelerometer crash detection
    │  SMS to emergency contacts
    │  GPS broadcast via Supabase Realtime
    ▼
Supabase (PostgreSQL + PostGIS + Realtime)
    │  incidents table  ←→  crash_logs table
    │  family_links     ←→  services table
    ▼
Web Dashboard (Next.js 15)
    ├── /dashboard      — live command center
    ├── /analytics      — crash pattern analysis
    ├── /track/[id]     — incident management
    ├── /admin          — system administration
    ├── /sos            — public emergency trigger
    └── /ice/[id]       — public medical card
```

---

## What's Next

- **Browser push notifications** — alert coordinators even when the tab is closed
- **Responder dispatch** — assign responders to incidents from the web
- **Road hazard crowdsourcing** — public reporting of potholes, flooding, debris
- **Response time leaderboard** — measure and improve responder performance
- **Predictive risk scoring** — flag high-risk road segments before crashes happen
