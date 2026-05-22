# Critical Review: RoadSoS Architecture Decisions

> **Review type**: Red team / architecture challenge
> **Reviewer**: Architecture & Design audit
> **Date**: 2026-05-13

---

## 1. On-Device AI (Gemma 2B/4B) vs Pure Cloud

### Premise
The app runs Gemma 2B (~780MB) or 4B (~2.5GB) locally on the phone for offline AI emergency assistance, with Groq API as fallback and hardcoded first-aid text as last resort.

### Challenges

#### Challenge 1: Storage Budget on Budget Devices
**Claim**: 780MB–2.5GB for a model is prohibitive on the target Indian market where many devices have 32–64GB storage (often nearly full).
- Real-world available storage on a 32GB device after OS + apps: ~8–12GB
- A 2.5GB model consumes 20–30% of remaining space
- User won't install 3GB for a single feature

**Mitigation**: Default to the 2B variant (~780MB). Make the model download opt-in with upfront dialog: "Download 780MB AI model to work offline? Or use cloud AI when online." Add storage check before download. Consider quantized GGUF variants (Q4_K_M reduces 4B to ~2.1GB, 2B to ~600MB).

#### Challenge 2: Inference Latency on Mid-Range Hardware
**Claim**: "Zero latency" on-device.
- Gemma 2B on a Helio G85 (common in ₹10–15K phones) takes 3–8 seconds per token without GPU acceleration
- A 50-token response could take 30+ seconds — unacceptable during an emergency
- Thermal throttling after 2–3 responses further degrades performance

**Mitigation**: Show a progress indicator ("Thinking...") rather than claiming zero latency. Pre-compile model for target architecture. Offload to NPU if present (MediaTek Dimensity, Qualcomm Snapdragon). If >5s/token, auto-fallback to Groq even if offline model is loaded.

#### Challenge 3: Model Freshness & Security
**Claim**: "100% private — no data leaves the device."
- Gemma 2B has a knowledge cutoff of ~early 2024; first-aid guidelines change (e.g., CPR protocols updated 2024)
- On-device model cannot be updated without downloading a new 780MB+ package
- No mechanism for security patching or prompt injection defense

**Mitigation**: Ship a small updatable prompt prefix that overrides model behavior ("You are an emergency assistant. CPR guidelines as of 2025: ..."). Use a versioned model manifest; prompt user to update on WiFi. Add input sanitization for prompt injection.

#### Challenge 4: Battery Impact
- LLM inference on CPU is extremely power-intensive
- Running Gemma 4B for 10 responses could drain 15–20% battery on a 5000mAh device
- In an emergency, user may need the phone to last for hours waiting for help

**Mitigation**: Cap on-device inference to 3 responses before prompting "Switch to cloud AI to save battery?" Force CPU affinity to efficiency cores for inference. Display battery warning before model download.

#### Challenge 5: Model Loading Time
- Gemma 2B takes 5–15 seconds to load into memory on cold start
- During an emergency, the user can't wait 15 seconds for the AI to be ready

**Mitigation**: Pre-warm the model on app launch (load into RAM immediately). If memory pressure, unload and show "AI loading..." overlay. Keep model in a Web Worker / separate JS context to avoid blocking UI.

---

## 2. Supabase vs Custom Backend

### Premise
Supabase provides PostgreSQL + Auth + Realtime + Edge Functions as the primary backend, replacing a custom Node.js API.

### Challenges

#### Challenge 1: Realtime Latency on Free Tier
- Supabase Realtime uses PostgreSQL replication slots; maximum ~200 concurrent connections on free tier
- For SOS broadcasts, a 1–3 second delay vs <200ms on a dedicated WebSocket server
- Indian users on Jio/Airtel mobile networks already have 50–150ms baseline latency

**Mitigation**: Use Supabase Realtime for non-critical sync (incident persistence, service data). Use the dedicated WebSocket Responder Server for time-critical SOS broadcasts. Fall back to Supabase Realtime only if the WS server is unreachable.

#### Challenge 2: Edge Function Cold Starts
- Twilio SMS dispatch runs via Supabase Edge Function (Deno)
- Cold starts on free tier: 500ms–2s
- During an SOS, every millisecond counts; a 2s cold start adds unacceptable delay

**Mitigation**: Use a keep-alive ping every 60s to keep edge function warm. Or better: move SMS dispatch to the mobile app directly (duel-channel: device SMS primary, Twilio via Edge Function as fallback only). Pre-warm edge function on app launch.

#### Challenge 3: Vendor Lock-In for Spatial Queries
- PostGIS with Supabase means the spatial query logic lives in managed PostgreSQL
- Migrating to another provider requires re-implementing `nearby_services()` RPC
- Supabase's PostGIS extension version may lag upstream

**Mitigation**: Abstract spatial queries behind a repository interface. Keep a haversine-based fallback in the mobile app (already done). Document the SQL migrations in `supabase/migrations/` so they're portable. Consider a pure-JS fallback for the dashboard too.

#### Challenge 4: Connection Pooling Limits
- Supabase free tier: 15 connections via PgBouncer
- Each mobile client opening a direct Supabase connection counts toward this limit
- With hundreds of users, connections exhaust quickly → auth/login failures

**Mitigation**: Use Supabase's stateless client (`@supabase/supabase-js`) which doesn't hold persistent DB connections — it connects to Kong API gateway. The connection limit applies to direct DB connections, not API calls. Verify this assumption with load testing. If problematic, add a thin Node.js BFF (backend-for-frontend) layer.

#### Challenge 5: Geo-Distribution for Indian Users
- Nearest Supabase region: Singapore (ap-southeast-1)
- Latency from Mumbai to Singapore: ~40–60ms; from rural Karnataka: 100–150ms
- No Indian region available as of 2026

**Mitigation**: Accept latency for non-critical data (service search, incident persistence). Keep critical paths (SOS triggering, crash detection) fully offline. Consider self-hosting Supabase on AWS Mumbai if latency becomes an issue. Monitor real-user metrics before deciding.

---

## 3. Expo (Managed Workflow) vs Bare React Native

### Premise
The app uses Expo SDK 54 with `expo-router`, `expo-sms`, `expo-sensors`, `expo-notifications`, `expo-location`, etc. It also uses `react-native-webrtc` and `react-native-reanimated`.

### Challenges

#### Challenge 1: Native Module (WebRTC) Compatibility
- `react-native-webrtc` requires native code — it's not a pure Expo module
- The app already uses `expo-build-properties` to configure native modules, which only works in Expo managed workflow with dev client or EAS Build
- Any new native dependency (e.g., `react-native-callkeep`, `react-native-incall-manager`) may not be compatible

**Mitigation**: The project is already on the **Expo dev client / prebuild path** (not pure managed workflow). This is correct for `react-native-webrtc`. Document that any new native module must be verified against Expo's compatibility list. Run `npx expo doctor` regularly. Consider Expo's "prebuild" config plugin API for native customizations.

#### Challenge 2: Background Execution Limits
- Crash detection requires the accelerometer to run when the app is backgrounded
- `expo-task-manager` supports background tasks but with iOS/Android limitations
- iOS kills background tasks aggressively after ~30s on non-BTLE devices
- Android 12+ has foreground service restrictions

**Mitigation**: Use a foreground service notification on Android ("RoadSoS is monitoring for crashes") to keep the process alive. On iOS, accept that background crash detection is best-effort — notify user via a banner. Consider a headless JS task via `expo-task-manager` with high-priority interval.

#### Challenge 3: Expo SDK Update Cadence
- Expo SDK 54 → 55 → 56 typically ship every 3–4 months
- Each upgrade requires updating all Expo modules simultaneously
- React Native 0.81 (currently used) may fall behind upstream RN releases
- Critical bug fixes in React Native may not be available until the next Expo SDK

**Mitigation**: Stay one version behind the latest Expo SDK (stable). Pin versions explicitly in `package.json`. Use `expo run:android` / `expo run:ios` (dev client) to test native changes without waiting for Expo SDK. Keep an eye on `react-native-reanimated` and `react-native-webrtc` compatibility.

#### Challenge 4: App Size Bloat
- Expo adds ~15-20MB to the base APK compared to bare RN
- `react-native-webrtc` adds another ~10MB for native libs
- Gemma model download adds 780MB–2.5GB
- Total app could exceed 100MB (APK) + 780MB (model) — too large for many users

**Mitigation**: Audit `expo` imports — only import specific modules, not the entire `expo` package. Use ProGuard/R8 for Android stripping. Use app bundle (AAB) instead of APK for Play Store delivery (smaller download). Make model download a separate post-install step.

#### Challenge 5: Testing Native Features in CI
- `expo-sms`, `expo-sensors`, `expo-notifications`, and `react-native-webrtc` require physical devices or emulators
- Jest tests mock these, but real integration bugs slip through
- No E2E testing strategy for the SOS flow that actually sends SMS

**Mitigation**: Use `expo-dev-client` for manual testing. Set up Maestro or Detox for E2E on emulators (though SMS can't be tested). For WebRTC, use unit tests for signaling logic and manual peer-to-peer tests. Accept that SMS delivery is a "trust but verify" feature — monitor via checkmark delivery status in production.

---

## 4. No-Signal Scenario (Complete Offline)

### Premise
The app is "offline-first" — SOS triggering, crash detection, AI assistance, service search, and incident logging all work without internet. Device SMS works as primary delivery channel.

### Challenges

#### Challenge 1: No Cellular Signal at All
**Claim**: "Device SMS works without internet."
- SMS requires cellular signal (GSM/CDMA). In remote highways, tunnels, basements, or during network congestion, there may be zero signal.
- The user triggers SOS → SMS send fails → Twilio fallback also fails (no internet) → **no notification reaches anyone**

**Mitigation**: This is the hardest problem. Strategies:
1. **SMS retry with exponential backoff** — keep trying every 30s, 2min, 5min, 10min for up to 2 hours
2. **Offline incident log** — record the SOS with timestamp + location; auto-sync when signal returns
3. **Audible alert** — the phone emits a loud alarm (already has `expo-av` + alarm.wav) to attract nearby help
4. **Visual beacon** — flash the screen LED/camera flash in a distress pattern
5. **Pre-emptive contact notification** — if the user is entering a known dead zone (telegraphed by weakening signal), pre-send a "I'm traveling through a low-signal area" text
6. **Mesh networking** (advanced) — use Nearby Connections API (Android) or Multipeer Connectivity (iOS) to relay SOS via other phones nearby

#### Challenge 2: Offline Service Data Is Stale
- Services cache has a 7-day TTL; seed data has only 10 services for Goa
- After 7 days without sync, the user sees potentially stale/closed services
- Service phone numbers may have changed

**Mitigation**: Extend cache TTL to 30 days for emergency use (stale is better than nothing). Lazy-sync: attempt background refresh when connectivity returns. Show a warning: "Service data last updated 12 days ago — may be outdated." Seed more comprehensive data (all major Indian highways, at minimum NH 66, NH 48, NH 44).

#### Challenge 3: Offline Incident Lost on App Reset
- Incidents are stored locally in AsyncStorage
- If the user clears app data, uninstalls, or switches devices, all incident history is lost
- In a real emergency, the incident record is evidence

**Mitigation**: Sync to Supabase opportunistically when online (fully async, never blocking). If the incident is synced, mark it as `synced: true`. Show the user: "Your incident has been saved locally. It will be backed up to the cloud when you're back online." Consider `expo-file-system` for writing a JSON backup to the device's Documents folder (survives app reinstall on iOS, persists in Android backups).

#### Challenge 4: AI Assistant Useless Without Model
- The Gemma model is a 780MB–2.5GB download
- If the user never downloaded it (storage warning, metered connection), they get only the 8-step first-aid text fallback
- During an emergency, they can't download 780MB on mobile data

**Mitigation**: This is a UX problem solvable at onboarding. Force the download during onboarding over WiFi with clear explanation: "This AI model works without internet — essential for emergencies." Allow deferral but warn "Without this, AI won't work offline." Compress to the smallest usable quantized variant. On the SOS screen, show a prominent "Download AI model for offline use" button pre-emptively (before an emergency).

#### Challenge 5: Crash Detection Drain During No-Signal
- If the user is lost without signal, the phone aggressively scanning for networks increases battery drain
- Crash detection accelerometer polling adds more drain
- Combined, the battery may die before help arrives

**Mitigation**: Reduce accelerometer sampling from 50ms to 200ms when no signal is detected (lowers sensitivity but extends battery). Show a battery percentage in the active incident view. Auto-disable crash detection at 15% battery with user notification. Enable low-power mode: disable background network scanning, reduce screen brightness, disable haptics.

---

## Summary of Risk Ratings

| Decision | Risk Level | Key Concern |
|---|---|---|
| On-device AI (Gemma) | 🔴 High | Storage + latency on budget devices |
| Supabase as backend | 🟡 Medium | Edge function cold starts, region latency |
| Expo managed workflow | 🟡 Medium | WebRTC native module compatibility |
| No-signal scenario | 🔴 High | SMS + internet both fail → nobody notified |
| Offline-first architecture | 🟢 Low | Well-implemented, but service data staleness is a concern |
| Dual-channel SMS | 🟢 Low | Solid pattern; retry logic is the gap |
| WebSocket responder server | 🟢 Low | Stateless, horizontal scaling, well-defined protocol |

---

## Recommendations (Priority Order)

1. **P0**: Add SMS retry queue with exponential backoff for no-signal scenarios
2. **P0**: Make Gemma model download opt-in with clear storage warning; default to 2B Q4_K_M quantized
3. **P1**: Pre-warm Supabase Edge Function to avoid cold start during SOS
4. **P1**: Reduce crash detection polling frequency when battery < 20% or signal is lost
5. **P1**: Extend service cache TTL to 30 days and seed all national highways
6. **P2**: Implement incident sync to device Documents folder (survives app reset)
7. **P2**: Add "Send SOS via SMS" retry notification when signal returns
8. **P3**: Evaluate mesh networking for multi-device SOS relay
9. **P3**: Investigate self-hosting Supabase on AWS Mumbai for latency reduction
