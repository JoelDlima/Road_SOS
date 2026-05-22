# RoadSoS - Features Overview

> RoadSoS is an offline-first emergency response mobile app designed for the Indian market. It works with or without internet connectivity.

---

## 1. SOS Alerting

### Manual SOS
A large, animated pulsing SOS button on the home screen triggers an emergency alert with a single tap. A confirmation dialog prevents accidental triggers. Once confirmed, the app sends SMS alerts to all registered emergency contacts.

### Dual-Channel SMS Delivery
SMS is sent via two parallel channels:
- **Primary**: Device SMS via `expo-sms` (works without internet)
- **Backup**: Supabase Edge Function via Twilio API (works when device SMS fails)

Each contact's delivery status is tracked individually with checkmarks for both channels.

### Automatic Crash Detection
Uses the device's accelerometer to detect sudden high-G-force events (e.g., collisions). Three sensitivity levels:
- **Low** (25 m/s²) — least sensitive
- **Medium** (20 m/s²) — default
- **High** (15 m/s²) — most sensitive

When a crash is detected, a 15-second countdown overlay appears allowing the user to cancel. If not cancelled, an automated SOS is dispatched. A 100ms debounce filter prevents false triggers from bumps or potholes.

### Quick Dial
One-tap speed dial buttons for Indian emergency numbers:
- **112** — National Emergency
- **108** — Ambulance
- **100** — Police
- **1033** — Highway Helpline

---

## 2. AI Emergency Assistant

An intelligent chat assistant specialized in emergency scenarios with a progressive fallback chain:

### Tier 1: On-Device AI (Offline)
- Runs **Gemma 2B or 4B** model locally via `llama.rn`
- Available in 2 model variants: E2B (~780MB) and E4B (~2.5GB)
- Zero latency, no internet required, 100% private (no data leaves the device)
- Downloads directly from Hugging Face with progress tracking

### Tier 2: Cloud AI
- Falls back to **Groq API** (LLaMA 3.3 70B) when local model is unavailable
- Streaming responses delivered token-by-token in real-time

### Tier 3: Offline First-Aid Text
- Hardcoded 8-step first-aid instructions as ultimate fallback
- Covers common emergency scenarios

### Multi-Language Support
The AI responds in the user's language when they write in:
- English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi

### Quick Prompts
One-tap buttons for common emergency questions:
- "Broken bone", "Burns", "Choking", "Bleeding", "CPR", "Heart Attack"

---

## 3. Nearby Emergency Services

### Geo-Spatial Search
Finds emergency services within 25km using PostGIS spatial queries (when online) or cached data (when offline).

### 7 Service Types
- 🏥 Hospital
- 🚑 Trauma Centre
- 🚨 Ambulance
- 👮 Police Station
- 🛻 Towing Service
- 🔧 Puncture Repair
- 🚗 Showroom

### Filtering & Sorting
- Filter by service type
- Sorted by distance from user's current location
- Distance displayed in kilometers

### Offline Resilience
- **Primary**: Supabase/PostGIS RPC
- **Fallback 1**: AsyncStorage cache (7-day TTL)
- **Fallback 2**: Built-in seed data for Goa (10 services)
- Uses haversine formula for distance when PostGIS is unavailable

### List/Map View
Toggle between list view and map view (map integration WIP — currently shows coordinates placeholder).

---

## 4. Incident Tracking & Reporting

Every SOS trigger creates a detailed incident report including:
- Auto-generated unique incident ID
- Trigger type (manual SOS or automatic crash detection)
- Timestamp with date and time
- GPS location coordinates
- SMS delivery status per contact (device + backup checkmarks)
- Nearby services at the time of incident
- Share location button
- Quick-dial emergency buttons

---

## 5. Onboarding

A guided 3-step setup on first launch:

1. **Personal Info** — Name, blood group (8 options), preferred language
2. **Emergency Contacts** — Add up to 3 contacts (name + phone number)
3. **Permissions** — Location access request + crash detection toggle

---

## 6. Settings & Configuration

- **Profile** — Edit name, blood group, language preference
- **Emergency Contacts** — Add, edit, or remove contacts (max 3)
- **Crash Detection Sensitivity** — Slider: Low / Medium / High
- **Dev Mode** — Toggle to simulate crash detection for testing/demos
- **Offline Cache Info** — View cache status and storage usage
- **Connection Status** — LIVE (online), OFFLINE (no internet), AI OFFLINE (AI endpoint unreachable)

---

## 7. Offline-First Architecture

All core features work without internet:

| Feature | Offline Capability |
|---|---|
| SOS Alerting | ✅ Full (device SMS) |
| Crash Detection | ✅ Full |
| AI Assistant | ✅ Full (local Gemma model) |
| Emergency Services | ✅ Full (cached data + seed data) |
| Incident Logging | ✅ Full (local storage) |
| Profile & Contacts | ✅ Full (AsyncStorage) |

Online features (Supabase, Groq, Twilio) enhance reliability but are never required.

---

## 8. Data Privacy

- No user accounts — all data stored locally on the device
- AI chat runs on-device; no conversation data leaves the phone
- Supabase and Groq integrations are best-effort and optional
- No analytics or tracking services
