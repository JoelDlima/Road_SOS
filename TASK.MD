# RoadSoS - Task Tracker

> Last updated: May 2026

---

## Legend

| Icon | Meaning |
|---|---|
| ✅ | Completed |
| 🔄 | In Progress |
| ⬜ | Pending |
| ❌ | Cancelled / Removed |

---

## ✅ Completed Features

### Core Infrastructure
- [x] Expo + React Native project setup with TypeScript
- [x] Expo Router file-based navigation (Stack + Tabs)
- [x] NativeWind (Tailwind CSS) styling integration
- [x] Dark-only UI theme
- [x] AsyncStorage persistence layer for offline data
- [x] `resolveJsonModule` enabled for knowledge base JSON imports

### Onboarding
- [x] 3-step onboarding flow (personal info → contacts → permissions)
- [x] Name, blood group, language selection
- [x] Emergency contacts management (add up to 3)
- [x] Location permission request
- [x] Crash detection enable/disable toggle
- [x] KeyboardAvoidingView for text input protection
- [x] `accessibilityLabel` on all interactive elements

### SOS Alerting
- [x] Animated pulsing SOS button on home screen
- [x] Manual SOS trigger with confirmation
- [x] SMS dispatch to all emergency contacts via `expo-sms`
- [x] Twilio backup SMS via Supabase Edge Function
- [x] SMS delivery status tracking (device + backup per contact)

### Automatic Crash Detection
- [x] Accelerometer-based G-force monitoring via `expo-sensors`
- [x] Configurable sensitivity thresholds (Low/Medium/High: 25/20/15 m/s²)
- [x] 100ms debounce to filter noise
- [x] 15-second countdown overlay before auto-SOS
- [x] Cancel option during countdown
- [x] Vibration alert on crash detection (intense burst pattern)
- [x] Urgency vibration pulses during last 5 seconds of countdown
- [x] Dev mode toggle with "Simulate Crash" button on home screen

### AI Emergency Assistant — Gemma 4 On-Device
- [x] On-device Gemma 4 model support via `llama.rn`
- [x] Dual variants: Gemma 4 E2B (~1.5 GB, 2B params) and Gemma 4 E4B (~5.34 GB, 8B params)
- [x] Updated model catalogue pointing to Gemma 4 GGUF files on HuggingFace
- [x] Gemma 4 chat template format (`<|turn|>` / `<|end|>` tokens)
- [x] Increased context window (4096 tokens)
- [x] Model download UI with variant picker and progress bar
- [x] Groq Cloud API fallback (LLaMA 3.3 70B)
- [x] Hardcoded first-aid text as ultimate fallback
- [x] Streaming token-by-token responses
- [x] Multi-language support (7 Indian languages)
- [x] Quick prompt buttons for common scenarios
- [x] Emergency-focused system prompt
- [x] Native function/tool calling support via llama.rn v0.10+ API

### AI Emergency Assistant — Web Search Extension
- [x] `search_road_safety` tool definition restricted to road safety topics
- [x] Google Custom Search API integration with curated domain whitelist (14 road safety sites)
- [x] Tool-calling loop in chat flow (model → search → model → answer)
- [x] Offline fallback: tools not registered when no connectivity
- [x] Visual "🔍 Searching road safety information..." indicator during tool execution
- [x] `.env.example` with `EXPO_PUBLIC_GOOGLE_SEARCH_API_KEY` and `EXPO_PUBLIC_GOOGLE_SEARCH_CX`

### AI Emergency Assistant — Context Injection
- [x] User profile injected into AI prompt (name, blood group, language)
- [x] Medical info injected (allergies, medications, conditions)
- [x] GPS location injected (address, coordinates)
- [x] Nearby services injected (up to 5 closest services with names, phones, distances)

### AI Emergency Assistant — Knowledge Base & RAG
- [x] Structured JSON knowledge base (5 modules, ~50 KB total):
  - [x] Emergency numbers (16 national + 5 states)
  - [x] First aid scenarios (14 scenarios with do/don't instructions)
  - [x] Good Samaritan Law (Indian Section 134A summary)
  - [x] Golden Hour protocol (60-minute trauma response guide)
  - [x] Accident scenario guides (8 types, 44.8% two-wheeler focus)
- [x] Lightweight RAG engine (`lib/rag.ts`) — keyword-matching search with stop word filtering
- [x] Knowledge context block injected into LLM prompt alongside user context

### Nearby Services
- [x] Geo-spatial search via Supabase/PostGIS RPC
- [x] 7 service types (Hospital, Trauma, Ambulance, Police, Towing, Puncture, Showroom)
- [x] Filter by service type
- [x] Sorted by distance with distance display
- [x] List/Map view toggle with live `react-native-maps` integration
- [x] Map markers with color-coded pins per service type
- [x] Callout popups showing service name and distance
- [x] Offline cache with 7-day TTL
- [x] Seed data (Goa, 10 services) as ultimate offline fallback
- [x] Haversine distance calculation for offline mode

### Quick Dial
- [x] Speed-dial buttons: 112 (emergency), 108 (ambulance), 100 (police), 1033 (highway)
- [x] `accessibilityLabel` on all speed-dial buttons

### Incident Tracking
- [x] Auto-generated incident ID
- [x] Stores trigger type (auto/manual), location, timestamp
- [x] SMS delivery status per contact
- [x] Nearby services on incident screen
- [x] Share location button on incident detail
- [x] Emergency dial buttons on incident detail
- [x] Error handling with "Incident not found" fallback UI
- [x] `insets.bottom` padding for home indicator
- [x] Text truncation on service names (`numberOfLines`)

### Settings
- [x] Profile editing (name, blood group, language)
- [x] Emergency contacts management with direct call button
- [x] Medical info (allergies, medications, conditions) — editable in settings & onboarding, included in SOS SMS
- [x] Crash detection sensitivity slider
- [x] Dev mode toggle (simulate crash for testing) — triggers 15s countdown overlay on home screen
- [x] Offline cache info display
- [x] Connection status badge (LIVE / OFFLINE / AI OFFLINE)
- [x] Loading skeleton instead of blank white screen while profile loads
- [x] try/catch error handling on all data operations
- [x] KeyboardAvoidingView for input protection
- [x] 300ms debounce on profile text fields to avoid excessive AsyncStorage writes
- [x] Validation feedback on empty contact fields

### Supabase Backend
- [x] Database schema (services + incidents tables with PostGIS)
- [x] `nearby_services` RPC for spatial queries
- [x] Incident logging (best-effort, fails gracefully)
- [x] Edge Function for Twilio SMS backup

### UI/UX — Accessibility (Global)
- [x] `accessibilityLabel` on SOS button, Quick Dial, send button, filter chips, call buttons
- [x] `accessibilityHint` on emergency actions
- [x] `accessibilityRole="button"` on Pressable elements
- [x] `accessibilityViewIsModal` on CountdownOverlay
- [x] `accessibilityLabel` on AI chat messages, status badge, service cards
- [x] `accessibilityValue` on progress bar in ModelDownloader

### UI/UX — Error & Loading States
- [x] Loading skeleton on Settings screen (was blank white screen)
- [x] Error state with fallback UI on incident detail
- [x] try/catch on all AsyncStorage operations (index.tsx, settings.tsx, chat.tsx)
- [x] 5-second timeout fallback on splash screen
- [x] Back button on model-setup screen

### UI/UX — Polish & Consistency
- [x] `numberOfLines` + `ellipsizeMode` on long text across all components
- [x] `fontFamily: 'monospace'` removed where it caused inconsistency
- [x] Character counter on chat input (remaining / 500)
- [x] `insets.bottom` padding on services, incident, and chat screens
- [x] `onRequestClose` on Android Modal (CountdownOverlay)

### Audio & Haptic Feedback
- [x] Audio alarm/siren during crash countdown via `expo-av` (requires `assets/alarm.wav`)
- [x] Haptic feedback (Vibration) on SOS button press
- [x] Haptic feedback (Vibration) on call button press in ServiceCard

### Background Crash Detection & Notifications
- [x] Background crash detection via `expo-task-manager` (background accelerometer monitoring)
- [x] Local push notification on crash detection (`expo-notifications`)
- [x] Android notification channel (`crash-alerts` with HIGH importance)
- [x] Notification permission request on app launch
- [x] Notification cleanup on app unmount

### Crash-Safe Rendering
- [x] `ErrorBoundary` component wrapping entire app in root layout
- [x] Fallback UI with error message and "Go Back Home" button
- [x] Error logging via `componentDidCatch`

### Code Quality & Performance
- [x] Theme constants (`Colors`, `FontFamily`, `Radius`) migrated — all hardcoded values replaced across 16 files
- [x] `React.memo` on `ChatBubble` and `ServiceCard` components
- [x] FlatList performance props (`windowSize`, `maxToRenderPerBatch`, `removeClippedSubviews`, `initialNumToRender`) on Services and Chat screens
- [x] Pull-to-refresh on Services and Settings screens via `RefreshControl`

### SOS Acknowledgment & Push Notifications
- [x] SOS acknowledgment push notification (confirms delivery count after trigger)
- [x] SOS warning notification when device SMS fails
- [x] Distinct Android notification channel (`sos-alerts`) with green light
- [x] SOS alert incident ID attached to notification data for deep-linking

### I.C.E. Emergency Info Screen
- [x] Standalone ICE screen (`app/ice.tsx`) accessible from home screen
- [x] Name, blood group, and medical info display for first responders
- [x] Emergency contact list with one-tap call buttons
- [x] Prominent "CALL 112 EMERGENCY" button
- [x] Warning banner about lock-screen visibility
- [x] ICE button on home screen with Heart icon

### Multi-Region Seed Data
- [x] Mumbai seed data (5 services: trauma centre, hospital, police, ambulance, towing)
- [x] Delhi seed data (5 services: trauma centre, hospital, police, ambulance, towing)
- [x] Region selector UI in Settings (pill-style buttons)
- [x] `REGIONS` map export in `offline-cache.ts`
- [x] Settings dynamically switches seed data per region selection

### Emergency Battery Optimization
- [x] Settings toggle for Emergency Battery Mode
- [x] `batteryOptimization` field added to `UserProfile` type
- [x] Persisted to AsyncStorage via profile

### Testing Suite
- [x] Jest + `jest-expo` configuration with transform ignore patterns
- [x] Test utilities with `SafeAreaProvider` wrapper
- [x] Module import smoke test
- [x] Project configuration sanity checks
- [x] `npm test` / `npm run test:watch` scripts added

### Architecture Documentation
- [x] `docs/architecture/real-time-tracking.md` — WebSocket responder tracking plan
- [x] `docs/architecture/user-accounts.md` — Supabase Auth sync schema
- [x] `docs/architecture/web-dashboard.md` — Next.js tracking dashboard plan
- [x] `docs/architecture/video-streaming.md` — WebRTC streaming plan
- [x] `docs/architecture/watch-companion.md` — Apple Watch / Wear OS plan
- [x] `docs/architecture/battery-optimization.md` — Battery strategy documentation
- [x] `docs/roadmap.md` — Full v1.0→v2.1 milestone roadmap

### User Accounts & Cloud Sync
- [x] Supabase Auth integration (`lib/auth.ts`) with sign in, sign up, sign out
- [x] Sign in screen (`app/auth/sign-in.tsx`) with email/password form
- [x] Sign up screen (`app/auth/sign-up.tsx`) with name/email/password form
- [x] Auth stack screens registered in root layout
- [x] `profiles` and `user_contacts` database tables with RLS policies
- [x] Auto-profile creation trigger on user signup
- [x] Cloud sync: profile and contacts pushed to Supabase on sign in
- [x] Cloud sync: data pulled from Supabase on sign in (merge with local)
- [x] Account section in Settings with "Sign In / Create Account" link
- [x] AsyncStorage-based session persistence

### Real-Time Responder Tracking
- [x] WebSocket server (`server/index.js`) — Node.js + ws library
- [x] Responder registration and location broadcast
- [x] SOS trigger/resolve event broadcasting
- [x] Client hook (`hooks/useResponderTracking.ts`) with auto-reconnect
- [x] Responder map markers (purple pins) on Services map view
- [x] Active SOS marker (red pin) on Services map view
- [x] "Responder Tracking Active" status indicator
- [x] `server/package.json` with dependencies

### Web App — Next.js 15 (Complete Rebuild)
- [x] Full web app at `apps/web/` — replaces old `dashboard/`
- [x] Next.js 15 App Router with React 19
- [x] Supabase Realtime replaces WebSocket servers — zero custom WS servers
- [x] i18n system with 7 Indian languages (English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi)
- [x] Language switcher dropdown in header with persistent localStorage
- [x] Supabase Auth integration (`@supabase/ssr`) with login/signup pages
- [x] Middleware for session refresh on all routes
- [x] Three Supabase client patterns: browser, server, middleware
- [x] Server Components for static pages, Client Components for interactive
- [x] Incident dashboard with real-time Supabase Realtime subscriptions
- [x] Stats cards (active incidents, total SOS, responders active)
- [x] Leaflet map with responder markers and custom SVG icons
- [x] Incident list with auto/manual filter, real-time updates
- [x] **Public tracking page** `/track/[incidentId]` — no auth required, for emergency contacts
- [x] Track page: status banner, live map, responder count, SMS status, copy link button
- [x] Admin panel with emergency services CRUD (Supabase-backed)
- [x] Service management: add, edit, delete with PostGIS POINT location
- [x] Error boundary, 404 page, loading states
- [x] Dark theme CSS with custom variables, Leaflet dark mode overrides
- [x] Tailwind CSS v4 for utility styling
- [x] Old `dashboard/` directory removed — fully superseded

### Video / Audio Streaming via WebRTC
- [x] WebRTC signaling server (`server/signaling-server.js`) on port 8081
- [x] Client hook (`hooks/useVideoStream.ts`) with full RTCPeerConnection lifecycle
- [x] Camera + microphone permission handling (Android + iOS)
- [x] Video streaming screen (`app/stream/[id].tsx`) with mute/end controls
- [x] Stream route registered in root layout
- [x] "Start Live Video Stream" button on incident detail screen
- [x] ICE candidate exchange via signaling server
- [x] `react-native-webrtc` dependency added to package.json

### Apple Watch & Wear OS Companion Apps
- [x] Apple Watch SOS button with haptic feedback (`watch/ios/`)
- [x] Apple Watch heart rate monitoring (HealthKit integration)
- [x] Apple Watch ICE info display (name, blood group, medical)
- [x] Apple Watch `WCSessionDelegate` for phone communication
- [x] Wear OS SOS button with Compose Material (`watch/android/`)
- [x] Wear OS heart rate display
- [x] Wear OS Gradle config with Play Services Wearable deps
- [x] Phone bridge (`lib/watch-bridge.ts`) — unified `syncICEDataToWatch`, `sendWatchSOS`
- [x] Setup documentation (`watch/README.md`)

---

## Known Issues

| Issue | Status |
|---|---|---|
| No user authentication — data tied to device only | By design |
| `tsconfig.json` `resolveJsonModule` enabled for JSON knowledge base imports | ✅ Done |
| Background crash detection requires Android foreground service permission | ⬜ Pending |
| E2E tests are smoke-level only — not full integration/component tests | Needs expansion |
