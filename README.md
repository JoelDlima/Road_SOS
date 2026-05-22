# RoadSoS — Expo Mobile App

Offline-first emergency response app for Indian roads. Works with or without internet — local AI, device SMS, and cached service data keep core flows alive when the network is gone.

This folder is the **Expo / React Native** client for the AIEM Open Innovation Hackathon entry. The Next.js responder dashboard lives in `../web-app/`. The Claude-generated reference designs that this app is built against live in `../RoadSOS/`.

---

## Quick start

```bash
# from this directory
cd "AIEM Open Innovation Hackathon/expo-app"
npm install
cp .env.example .env   # then fill in keys (see "Environment" below)
npx expo start
```

Press `a` for an Android emulator, `i` for iOS simulator, or scan the QR code with the **Expo Go** app on a physical device.

---

## What this app does

| Feature | Offline | Online |
|---|---|---|
| SOS SMS to emergency contacts | ✅ Device SMS | ✅ + Twilio backup via Supabase Edge Function |
| Crash detection (accelerometer + jerk) | ✅ Full | ✅ Full |
| AI emergency assistant | ✅ Local Llama 3.2 / RoadSoS 3B | ✅ Groq Llama 3.3 70B |
| Nearby emergency services | ✅ Cached / seed data | ✅ Supabase + PostGIS |
| Incident reports | ✅ Local storage | ✅ Cloud sync |
| Live video stream during SOS | — | ✅ WebRTC via signaling server |

**Operating modes**

- **Drive mode** — uses jerk + spike-ratio analysis to ignore speed bumps and braking. Only a sudden, high-energy collision triggers an SOS countdown.
- **Normal mode** — direct impact threshold tuned for falls and pedestrian collisions.

---

## Prerequisites

- **Node.js** 18+ (Node 20 recommended, matches the CI workflow)
- **Android Studio** with NDK `27.1.12297006` if you plan to do a native Android build
- **Java 17**
- **Expo CLI** (`npm install -g expo-cli`)

> **Windows users:** This Expo project includes native modules (`react-native-webrtc`, `llama.rn`, `expo-build-properties`) whose native build paths can hit Windows' MAX_PATH (260-char) limit. Keep the project path **short**. The current location (`D:\Moses\Project\RoadSafety Hackathon\AIEM Open Innovation Hackathon\expo-app`) is already near the safe limit — do not nest it any deeper before running `gradlew assembleRelease`.

---

## Available scripts

```bash
npm start          # Start the Expo dev server (Metro)
npm run android    # Build and run the dev client on a connected Android device/emulator
npm run ios        # Build and run on iOS simulator
npm run web        # Run the web preview (limited — primary target is mobile)
npm test           # Run Jest tests
npm run test:watch # Jest in watch mode
npm run build-apk  # Windows: build a release APK via gradlew.bat
```

---

## Environment

Copy `.env.example` to `.env` and fill in the keys. The variables are:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GROQ_API_KEY=gsk_your-groq-key
EXPO_PUBLIC_GOOGLE_SEARCH_API_KEY=your-google-api-key   # optional
EXPO_PUBLIC_GOOGLE_SEARCH_CX=your-search-engine-id      # optional
```

The app will **gracefully degrade** if any of these are missing:
- No Supabase keys → cloud sync and incident upload disabled, but offline SMS still works.
- No Groq key → AI chat falls back to the on-device model, then to a static first-aid playbook.

---

## AI assistant — three-tier inference ladder

The chat screen automatically picks the best available tier at the time of the request:

1. **Cloud (online)** — Groq `llama-3.3-70b-versatile`, streamed response.
2. **Local (offline)** — On-device Llama 3.2 / RoadSoS 3B via [`llama.rn`](https://github.com/mybigday/llama.rn). No internet needed once the model is downloaded.
3. **Fallback** — A short honest message that points to 112 plus a hint to download the offline model. We deliberately do **not** auto-paste a long canned first-aid list when the AI tier fails — it confuses the user when their actual question is ignored.

A toggle in the top-right of the chat header lets you force the offline model when both are available. The toggle is hidden when offline (no choice to offer).

### Model variants

| Key | Display name | Size | Source |
|---|---|---|---|
| `llama32_1b` | Llama 3.2 1B | ~780 MB | Meta / HuggingFace |
| `llama32_3b` | Llama 3.2 3B | ~2.0 GB | Meta / HuggingFace |
| `roadsos_3b_finetuned` | RoadSoS 3B (Fine-tuned) | ~2.0 GB | [`moses6849/roadsos-3b-road-safety`](https://huggingface.co/moses6849/roadsos-3b-road-safety) |

The fine-tuned model was trained with QLoRA on Google Colab's free T4 tier using 210+ road-safety Q&A pairs and exported as GGUF Q4\_K\_M.

---

## Building the Android APK

```powershell
cd android
.\gradlew.bat assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk` (~125 MB).

The release build signs with the **debug keystore** by default (`signingConfigs.debug` in `app/build.gradle`). Replace it with a production keystore before publishing to the Play Store.

> The `android/app/.cxx` folder (CMake native build cache) is regenerated on every native build and intentionally not tracked here. It can grow to **~370 MB**. The `.gitignore` already excludes it.

---

## Project structure

```
expo-app/
├── app/                       # Expo Router file-based routes
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Tab bar — Home / Services / Chat / Settings
│   │   ├── index.tsx          # Home — SOS button, mode toggle, quick dial, nearby help
│   │   ├── services.tsx       # Nearby services — Leaflet map + filterable list
│   │   ├── chat.tsx           # AI emergency assistant (cloud → local → fallback)
│   │   └── settings.tsx       # Identity, contacts, crash detection, region cache
│   ├── auth/                  # Sign in / Sign up (Supabase)
│   ├── incident/[id].tsx      # Post-SOS incident detail
│   ├── stream/[id].tsx        # WebRTC live video stream during an active SOS
│   ├── onboarding.tsx         # First-launch 3-step setup (matches RoadSOS design)
│   ├── model-setup.tsx        # Optional offline AI model download
│   ├── ice.tsx                # Lock-screen-friendly emergency medical card
│   ├── index.tsx              # Splash — routes to onboarding or tabs
│   ├── +not-found.tsx         # 404
│   └── _layout.tsx            # Root Stack — error boundary, notifications setup
├── components/
│   ├── AppKit.tsx             # Design system: Header, Panel, Chip, StatusPill, IconBadge, etc.
│   ├── SOSButton.tsx          # Animated pulsing SOS button (Reanimated)
│   ├── ModelDownloader.tsx    # GGUF download with pause/resume
│   ├── LeafletMap.tsx         # Embedded Leaflet (WebView) with markers
│   ├── CountdownOverlay.tsx   # 15s cancel overlay for auto-crash SOS
│   ├── ChatBubble.tsx         # Markdown-aware bubble with role styling
│   ├── ChatInput.tsx          # Streaming-aware input with stop button
│   └── ...
├── hooks/
│   ├── useCrashDetector.ts    # Accelerometer + jerk crash detection (3 sensitivity levels)
│   ├── useSOSFlow.ts          # SOS dispatch orchestration
│   ├── useLocation.ts         # GPS with fallback
│   ├── useNearbyServices.ts   # Nearby services fetch + offline cache
│   └── useVideoStream.ts      # WebRTC video stream lifecycle
├── lib/
│   ├── local-llm.ts           # llama.rn wrapper: init, stream, stop, model variants
│   ├── groq.ts                # Groq API streaming + context block builder
│   ├── sms.ts                 # SOS SMS via expo-sms
│   ├── direct-sms.ts          # Native Android SmsManager + Supabase Twilio fallback
│   ├── offline-cache.ts       # AsyncStorage cache for nearby services (10 regions)
│   ├── background-service.ts  # Foreground service for crash detection
│   ├── native-crash-service.ts# Bridge to Kotlin crash service
│   ├── supabase.ts            # Supabase client
│   ├── auth.ts                # Auth helpers
│   ├── notifications.ts       # Expo notifications channel setup
│   ├── crash-logger.ts        # Crash event log (Supabase + AsyncStorage mirror)
│   ├── overpass.ts            # OSM Overpass API for live service lookup
│   ├── region-detector.ts     # Region resolution from lat/lng
│   └── ...
├── constants/
│   ├── theme.ts               # Colors, Typography, Spacing, Radius, Animation tokens
│   └── layout.ts              # Tab bar height + safe-area helpers
├── android/                   # Native Android project (Expo prebuild output)
├── assets/                    # App icons, splash, branding
├── supabase/                  # Schema, migrations, edge functions (read-only mirror)
├── ml/                        # QLoRA fine-tuning data and Colab pipeline
├── server/                    # WebRTC signaling server (Node) — run separately
├── watch/                     # Wear OS / Apple Watch companion apps
├── tests/                     # Jest tests
├── types/                     # Shared TypeScript types
└── package.json
```

---

## Permissions (Android)

| Permission | Purpose |
|---|---|
| `ACCESS_FINE_LOCATION` | GPS for incident reports and nearby services |
| `ACCESS_BACKGROUND_LOCATION` | Location during crash detection when app is backgrounded |
| `SEND_SMS` | Direct device SMS for SOS alerts |
| `VIBRATE` | Haptic feedback for the crash countdown |
| `FOREGROUND_SERVICE` | Persistent crash detection service |
| `WAKE_LOCK` | Keep the CPU alive for crash monitoring |
| `RECEIVE_BOOT_COMPLETED` | Auto-restart crash detection after reboot |

---

## Backend (Supabase)

- **`emergency_services`** — PostGIS table, 7 service types, indexed spatially.
- **`incidents`** — SOS incident log: GPS, contacts notified, delivery status.
- **`profiles`** — User profile: name, blood group, language, emergency contacts.
- **Edge function `send-sos-sms`** — Twilio backup SMS when device SMS fails.

The schema and edge functions live in `supabase/` so you can re-deploy with the Supabase CLI:

```bash
supabase db push
supabase functions deploy send-sos-sms
```

---

## Watch companion

Two companion apps for wearables in `watch/`:

- **Wear OS** (`watch/android/`) — One-tap SOS, heart rate via Health Services API, ICE info.
- **Apple Watch** (`watch/ios/`) — Same features via HealthKit + WatchConnectivity.

See `watch/README.md` for setup instructions.

---

## Design source

All screens in this app are built to match the Claude-generated design canvas at `../RoadSOS/`. Key files:

- `RoadSOS/tokens.css` — Design tokens (colors, radii, typography). The values are mirrored in `constants/theme.ts`.
- `RoadSOS/shared.jsx` — Building blocks: PhoneScreen, ScreenHeader, Panel, Chip, IconBadge, StatusPill, Button, GhostButton, TabBar. The React Native equivalents live in `components/AppKit.tsx`.
- `RoadSOS/screens-onboarding.jsx` — 3-step onboarding + model setup flow.
- `RoadSOS/screens-home.jsx` — Home cockpit + crash countdown overlay.
- `RoadSOS/screens-tabs.jsx` — Services list, AI chat, Settings.
- `RoadSOS/screens-misc.jsx` — I.C.E. card, incident detail, sign-in, notifications.
- `RoadSOS/RoadSoS Screens.html` — Renders the whole canvas in a browser. Open it directly in Chrome/Edge to inspect the designs side-by-side with the implementation.

When updating screens, treat the JSX in `RoadSOS/` as the source of truth for **layout and visual hierarchy**, but read it as a wireframe — the React Native implementation here uses real lucide icons, real form state, real animations, and the same color tokens.

---

## Troubleshooting

**Metro fails to start with "EMFILE: too many open files"**
Increase your file watcher limit (`ulimit -n 65536` on macOS/Linux). On Windows, restart Metro and close other heavy processes.

**Gradle build fails with `MAX_PATH` errors on Windows**
Move the project to a shorter path (e.g. `C:\rsos\expo-app`). The native CMake builds for `react-native-webrtc` and `llama.rn` produce deeply nested paths.

**Offline AI says "Loading… 60s+"**
The first model load from disk is slow (~30–90s on mid-range Android). Subsequent loads use the warmed `_ctx` and respond in <2s. The chat header shows a "Slow…" hint after 60s.

**SOS SMS opens the SMS app instead of sending silently**
Android restricts background SMS for sideloaded apps. RoadSoS will pre-fill the SMS app — the user just taps Send. Production builds signed with Play-Console keys can request `SEND_SMS` directly.

---

## Hackathon context

- **Project:** AIEM Open Innovation Hackathon — RoadSafety track
- **Reference designs:** `../RoadSOS/`
- **Companion responder dashboard:** `../web-app/` (Next.js)
- **Source repos before consolidation:** `roadsos-mobile` (this codebase) and `roadsos-web` (the dashboard). Their `.git/` history is intentionally not carried over here — the hackathon entry stands on its own.
