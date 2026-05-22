# RoadSoS Web — Session Update Log

> Date: 2026-05-22  
> Session: Full UI redesign + 7 new hackathon features

---

## Features Implemented This Session

### 1. Dark / Light Mode Toggle

**Location:** Top-right of the nav bar on every page  
**How it works:**
- `lib/ThemeProvider.tsx` — React context that stores `'dark' | 'light'` state
- On mount, reads `localStorage` for saved preference
- Calls `document.documentElement.setAttribute('data-theme', theme)` to switch
- All colors are CSS custom properties in `globals.css` under `:root` (dark) and `[data-theme="light"]`
- Light theme uses warm off-white `#f0ede8` base — not blinding white
- Toggle button: pill switch with 🌙/☀ emoji knob, top-right of nav
- Persists across page reloads via `localStorage`

**Map tile switching:** `ResponderMap.tsx` uses a `MutationObserver` on `document.documentElement` to watch `data-theme` changes. Dark mode → CartoDB `dark_all` tiles. Light mode → CartoDB `light_all` tiles. `key` prop on `TileLayer` forces Leaflet to reload tiles.

---

### 2. Dashboard Redesign

**Location:** `/[locale]/dashboard`

**Changes:**
- **72px hero active incident count** — red when non-zero, white when zero. The number is the message.
- **Red left-edge accent** on the feed panel at 18% opacity. Flashes to 100% and fades back over 2s when a new incident arrives via realtime INSERT.
- **Row left borders replace AUTO/MANUAL badges** — amber (`#FF9F0A`) for auto-detected crashes, blue (`#0A84FF`) for manual SOS. Color is faster to read than text.
- **ACTIVE badge removed** — silence means active. Only RESOLVED shows in green. Removes 11 identical badges that carried zero information.
- **Recency tint** — top row gets `color-mix(in srgb, var(--red) 5%, transparent)` background. Subtle "current" indicator.
- **Scanline overlay** on the map via `.map-scanline::after` CSS pseudo-element — stops the map looking like a plain div.
- **Geolocation** — `navigator.geolocation.getCurrentPosition` on mount. Map flies to your location. Blue dot marker shows your exact GPS position.
- **Landmarks toggle** — button top-right of map. Toggles incident and responder markers on/off. Your location dot always shows.
- **4-column stat strip** — Active / SOS Alerts / Responders / Resolved% in a single compact row.

---

### 3. Map Improvements

**Location:** `components/ResponderMap.tsx`

- **`FlyToCenter` component** — watches `center` prop inside `MapContainer` via `useMap()`. When geolocation resolves (async, after mount), `map.flyTo(center, 13, { duration: 1.5 })` is called. Fixes the issue where `MapContainer`'s `center` prop is read-only after mount.
- **User location blue dot** — `L.divIcon` 14px blue circle with pulse ring. Popup shows exact lat/lng.
- **Incident red dots** — `L.divIcon` 12px red circle with white border and `rgba(255,59,48,0.25)` glow. Popup shows incident ID (red mono), name, time, coordinates, View link.
- **PostGIS location parsing** — `mapIncident()` tries flat `lat`/`lng` columns first, then falls back to `raw.location.coordinates` (PostGIS returns `[lng, lat]`, swapped correctly).
- **Theme-aware tiles** — `MutationObserver` watches `data-theme` attribute changes.
- **Leaflet CSS** imported directly in the component file to prevent `appendChild` crash.

---

### 4. Track Page Redesign

**Location:** `/[locale]/track/[incidentId]`

- **Fixed lat/lng swap** — was `[lng, lat]`, now correctly `[lat, lng]`
- **Dramatic status banner** — 28px status label, pulsing dot for active, faint "SOS"/"OK" watermark at 5% opacity, left accent bar, blood group as red badge
- **Stats cards** with left accent borders and large numbers (36px font-weight-300)
- **Scanline overlay** on map

---

### 5. Admin Page Redesign

**Location:** `/[locale]/admin`

- **56px hero numbers** for active incidents and service count
- Status items in a single bordered list (not 3 separate boxes)
- Section labels dimmed to `var(--text-faint)` — structural, not content
- Management cards with left accent borders

---

### 6. Services Page Redesign

**Location:** `/[locale]/admin/services`

- List wrapped in a single bordered container
- Each row has a left border in the type's color (same system as dashboard rows)
- Type shown as color dot + mono label — no background chip needed
- 24×7 badge added
- Header matches admin mono-label + light title style

---

### 7. Bug Fixes

- **Runtime TypeError `cannot read properties of undefined (reading 'unsubscribe')`** — Fixed by moving Supabase channels to `useRef` (`channelRef`, `responderChannelRef`, `supabaseRef`). Cleanup function now always has valid references.
- **`postgres_changes` after `subscribe()` error** — Fixed by chaining `.on(...).subscribe()` in one expression instead of calling `.on()` after `.subscribe()`.
- **Filter button border conflict** — Replaced `border: 'none'` (shorthand) + `borderBottom` (longhand) with all four longhand properties to fix React inline style warning.
- **`appendChild` crash on TileLayer** — Fixed by importing `leaflet/dist/leaflet.css` directly in `ResponderMap.tsx` and removing the nested `MapContent` wrapper component.

---

## New Features (Hackathon Phase)

### 8. Crash Severity Inspector

**Location:** `/[locale]/admin/crash-logs`  
**Table:** `crash_logs` (existing, written by mobile app)  
**Columns used:** `detected_at`, `mode`, `sensitivity`, `g_force`, `jerk_gs`, `latitude`, `longitude`, `address`, `outcome`

**How it works:**
- Reads `crash_logs` table ordered by `detected_at DESC`
- Color-coded rows: red = `sos_sent`, amber = `cancelled`, grey = pending/other
- Sortable by G-Force (click column header)
- Shows location as address if available, otherwise lat/lng
- Zero backend work — pure read UI

---

### 9. Incident Resolve Button

**Location:** `/[locale]/track/[incidentId]`  
**Schema change:** Added `resolution_note text` column to `incidents`  
**Existing column used:** `resolved_at timestamptz` (already existed)

**How it works:**
- "Resolve" button appears when `status !== 'resolved'`
- Inline text field for optional resolution note
- On submit: `UPDATE incidents SET status='resolved', resolved_at=now(), resolution_note=?`
- "Re-open" button appears when already resolved — sets `status='active'`, clears `resolved_at` and `resolution_note`
- Coordinators can now manage incident lifecycle from the web

---

### 10. Crash Analytics Charts

**Location:** `/[locale]/analytics`  
**New npm:** `recharts@2.12.7`  
**Data source:** `incidents` table (`created_at`, `trigger_type`)

**Three charts:**
1. **Incidents per day** (line chart) — last 30 days, grouped by date
2. **Incidents by hour of day** (bar chart) — 0–23h, shows rush hour spikes
3. **Auto vs Manual ratio** (donut chart) — trigger_type breakdown

**How it works:**
- Single Supabase query: `select created_at, trigger_type from incidents order by created_at`
- All grouping done client-side
- No date-fns needed — uses native `Date` methods

---

### 11. Accident Hotspot Heatmap

**Location:** Dashboard map toggle  
**New npm:** `leaflet.heat` (loaded dynamically)

**How it works:**
- Toggle button on dashboard map: "Markers" ↔ "Heatmap"
- In heatmap mode, fetches all incidents with location from Supabase
- Passes `[lat, lng, intensity]` array to `L.heatLayer`
- Intensity = 1.0 for all points (equal weight)
- In markers mode, shows the existing red dot markers

---

### 12. Web SOS (No App Required)

**Location:** `/[locale]/sos` (public, no auth)  
**API route:** `/api/sos` (server-side, uses service role key)

**Flow:**
1. User opens `/sos`
2. Browser requests GPS permission
3. User fills name + phone
4. "Send SOS" → POST to `/api/sos`
5. API route inserts incident into Supabase
6. Confirmation page shows incident ID + tracking link

**Rate limiting:** Simple DB check — max 3 inserts per IP per hour using `sos_rate_limit` table  
**Security:** Service role key only used server-side in API route, never exposed to client

---

### 13. ICE Card QR Generator

**Location:** `/[locale]/track/[incidentId]` (QR shown on track page)  
**Public page:** `/ice/[id]` (no auth, read-only)  
**New npm:** `qrcode.react@4.1.0`

**How it works:**
- QR code on track page links to `/ice/[incidentId]`
- `/ice/[id]` is a public page showing: name, blood group, medical info from `profiles` table
- Token = incident UUID (hard to guess, no separate token table needed)
- Print-friendly CSS for physical QR sticker

---

### 14. Family Tracking Portal

**Location:** `/[locale]/track/family/[code]`  
**New table:** `family_links (id, code varchar(6), user_id uuid, expires_at timestamptz)`

**How it works:**
- Mobile app generates a 6-digit alphanumeric code and inserts into `family_links`
- Family member visits `/track/family/XXXXXX`
- Page queries `family_links` by code, gets `user_id`
- Queries most recent incident for that `user_id`
- Shows: Safe / Active incident status + last known location on map
- Realtime subscription updates status live

---

## CSS Architecture

All colors are CSS custom properties. No hardcoded hex in component inline styles (except semantic type colors in services page which are identity colors, not theme colors).

```css
/* Dark (default) */
:root { --bg: #0a0a0a; --surface: #111111; --text-primary: #f2f2f7; ... }

/* Light (warm off-white) */
[data-theme="light"] { --bg: #f0ede8; --surface: #e8e4de; --text-primary: #1a1a1a; ... }
```

Switching `data-theme` on `<html>` cascades to every element instantly.
