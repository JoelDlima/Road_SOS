# RoadSoS — Emergency Response Web Dashboard

> Real-time emergency coordination platform for road accident response.  
> Built for the **AIEM Open Innovation Hackathon**.

---

## What is RoadSoS?

RoadSoS is a two-part system:

- **Mobile app** (React Native) — detects crashes via accelerometer, sends SOS alerts, tracks the driver's location
- **Web dashboard** (this repo) — coordinator's view for monitoring live incidents, dispatching help, and analysing crash data

This repo is the **web dashboard**.

---

## Features

### Live Dashboard
- **Real-time incident feed** — new incidents appear instantly via Supabase Realtime (no refresh needed)
- **72px active incident counter** — the number hits you before you read anything else
- **Filter by trigger type** — All / Auto-detected / Manual SOS
- **Row-level color coding** — amber left border = auto crash, blue = manual SOS
- **Resolved badge** — silence means active; only resolved incidents show a badge

### Interactive Map
- **CartoDB Dark Matter tiles** — dark ops aesthetic, India-centered
- **Your location** — blue dot, map flies to your GPS on load
- **Incident markers** — red dots with popup (ID, name, time, coordinates, View link)
- **Responder markers** — purple pins with live position updates
- **Heatmap toggle** — switches between markers and a crash density heatmap (blue → amber → red gradient)
- **Landmarks toggle** — show/hide all markers
- **Light/dark tile switching** — map tiles change with the theme

### Crash Analytics (`/analytics`)
- **Incidents per day** — line chart, last 30 days
- **Incidents by hour** — bar chart showing rush hour spikes (0–23h)
- **Auto vs Manual ratio** — donut chart with summary stats

### Crash Severity Inspector (`/admin/crash-logs`)
- Reads the `crash_logs` table written by the mobile app
- Columns: Time · Mode · Sensitivity · G-Force · Jerk (g/s) · Location · Outcome
- Color-coded rows: red = SOS sent, amber = cancelled, grey = pending
- Sortable by G-Force (click column header)
- Summary strip: SOS count, cancelled count, peak G-force

### Incident Management (`/track/[id]`)
- **Resolve button** — sets `status = 'resolved'`, records `resolved_at`, optional resolution note
- **Re-open button** — clears resolution, sets back to active
- **ICE Card QR** — QR code linking to a public medical info card for first responders
- **SMS status** — shows which contacts were notified

### Web SOS (`/sos`) — No App Required
- Public page, no login needed
- Browser requests GPS permission
- Fill name + phone → Send SOS
- Inserts incident into Supabase via server-side API route
- Rate-limited: max 3 per IP per hour
- Confirmation page with incident ID and tracking link

### ICE Card (`/ice/[id]`) — Public
- Scan the QR code on the track page
- Shows: name, blood group, incident time
- Print-friendly layout for physical QR stickers on dashboards/helmets
- No auth required — token is the incident UUID

### Family Tracking (`/track/family/[code]`)
- Mobile app generates a 6-digit code and stores it in `family_links`
- Family member visits `/track/family/XXXXXX`
- Shows: Safe / Active Incident status + last known location on map
- Updates in real-time via Supabase Realtime

### Admin Panel (`/admin`)
- System status (Database / Realtime / Services)
- Hero numbers: active incidents + registered services
- Links to: Emergency Services CRUD, Incidents feed, Crash Logs

### Emergency Services CRUD (`/admin/services`)
- Add, edit, delete registered emergency services
- Types: hospital, trauma centre, ambulance, police, towing, puncture, showroom
- Each service has: name, type, phone, address, GPS location, 24×7 flag

### Dark / Light Mode
- Toggle in the top-right of the nav bar
- Light theme: warm off-white (`#f0ede8`) — not blinding white
- Persists across page reloads via `localStorage`
- Map tiles switch between CartoDB Dark Matter and CartoDB Light

### Internationalisation
- 7 languages: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi
- URL-prefix routing: `/en/`, `/hi/`, `/ta/`, etc.

---

## Pages

| Route | Auth | Description |
|-------|------|-------------|
| `/[locale]/dashboard` | Yes | Live feed + map + stats |
| `/[locale]/analytics` | Yes | Charts: daily / hourly / trigger ratio |
| `/[locale]/track/[id]` | Yes | Incident detail + resolve + QR |
| `/[locale]/admin` | Yes | System overview |
| `/[locale]/admin/services` | Yes | Emergency service CRUD |
| `/[locale]/admin/crash-logs` | Yes | Crash severity table |
| `/[locale]/login` | No | Sign in |
| `/[locale]/signup` | No | Create account |
| `/[locale]/sos` | No | Public web SOS form |
| `/ice/[id]` | No | Public ICE card |
| `/[locale]/track/family/[code]` | No | Family tracking portal |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project

### Setup

```bash
git clone --branch web --single-branch https://github.com/Spacey6849/RoadSOS.git
cd RoadSOS
npm install
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DEFAULT_LANG=en
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-side only, never exposed to client
```

> Add all four to your Vercel project settings under Environment Variables.

---

## Database Schema

### `incidents`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_name` | text | |
| `blood_group` | text | |
| `trigger_type` | text | `'auto'` or `'manual'` |
| `location` | geometry | PostGIS `POINT(lng lat)` |
| `address` | text | |
| `status` | text | `'active'` or `'resolved'` |
| `sms_status` | jsonb | |
| `created_at` | timestamptz | |
| `resolved_at` | timestamptz | Set when resolved |
| `resolution_note` | text | Optional coordinator note |

### `crash_logs`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `detected_at` | timestamptz | |
| `mode` | text | Detection mode |
| `sensitivity` | text | low / medium / high |
| `g_force` | float8 | Peak G-force reading |
| `jerk_gs` | float8 | Jerk in g/s |
| `latitude` / `longitude` | float8 | |
| `address` | text | |
| `outcome` | text | `sos_sent` / `cancelled` |

### `family_links`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `code` | varchar(6) | Unique 6-digit code |
| `user_id` | uuid | FK → auth.users |
| `expires_at` | timestamptz | Default: 7 days |

### `services`
| Column | Type |
|--------|------|
| `id` | uuid |
| `name`, `service_type` | text |
| `address`, `city`, `state` | text |
| `location` | geometry (PostGIS) |
| `primary_phone` | text |
| `is_24x7` | boolean |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL + PostGIS) |
| Realtime | Supabase Realtime (postgres_changes + broadcast) |
| Auth | Supabase Auth |
| Map | Leaflet + react-leaflet |
| Map tiles | CartoDB (dark_all / light_all) |
| Heatmap | leaflet.heat |
| Charts | Recharts |
| QR codes | qrcode.react |
| Animations | Framer Motion |
| Icons | Lucide React |
| Styling | CSS custom properties (no Tailwind classes in components) |
| Fonts | Inter (body) + JetBrains Mono (code/labels) |
| Deployment | Vercel |

---

## Project Structure

```
app/
├── [locale]/
│   ├── layout.tsx          — Nav + ThemeProvider + LanguageProvider
│   ├── dashboard/          — Live incident feed + map
│   ├── analytics/          — Charts page
│   ├── track/
│   │   ├── [incidentId]/   — Incident detail + resolve + QR
│   │   └── family/[code]/  — Family tracking portal
│   ├── admin/
│   │   ├── page.tsx        — System overview
│   │   ├── services/       — Emergency service CRUD
│   │   └── crash-logs/     — Crash severity inspector
│   ├── sos/                — Public web SOS form
│   ├── login/ signup/      — Auth pages
├── ice/[id]/               — Public ICE card (no auth)
├── api/sos/                — Server-side SOS API route
components/
└── ResponderMap.tsx        — Leaflet map (theme-aware, heatmap, markers)
lib/
├── ThemeProvider.tsx       — Dark/light mode context
├── types.ts                — TypeScript interfaces
├── supabase/               — Supabase client helpers
└── i18n/                   — Translations + LanguageProvider
```

---

## Deployment (Vercel)

1. Connect the `web` branch to Vercel
2. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEFAULT_LANG` = `en`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only — safe in Vercel, never in client bundle)
3. Deploy

---

## Feature Status

| Feature | Status |
|---------|--------|
| Live incident feed (realtime) | ✅ |
| Interactive Leaflet map | ✅ |
| Accident hotspot heatmap | ✅ |
| Crash analytics charts | ✅ |
| Crash severity inspector | ✅ |
| Incident resolve / re-open | ✅ |
| Web SOS (no app required) | ✅ |
| ICE card QR generator | ✅ |
| Family tracking portal | ✅ |
| Dark / light mode | ✅ |
| Emergency services CRUD | ✅ |
| Auth (login / signup) | ✅ |
| i18n (7 languages) | ✅ |
| Browser push notifications | Planned |
| Response time leaderboard | Planned |
| Road hazard crowdsourcing | Planned |
