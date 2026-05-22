# RoadSoS - Emergency Response Mobile App

## Overview

RoadSoS is an **offline-first emergency response mobile application** built with React Native and Expo. It provides instant SOS alerting, automatic crash detection, AI-powered emergency assistance, and nearby emergency service discovery — all designed to work with or without an internet connection. Targeted for the Indian market with support for 7 Indian languages.

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | React Native 0.81 + Expo SDK 54 |
| **Language** | TypeScript (strict mode) |
| **Routing** | Expo Router v6 (file-based) |
| **Styling** | NativeWind v4 (Tailwind CSS) + inline styles |
| **Backend** | Supabase (PostgreSQL + PostGIS) |
| **AI/LLM** | On-device Gemma (llama.rn) + Groq Cloud API |
| **Animations** | react-native-reanimated v4 |
| **Maps/Location** | react-native-maps + expo-location |
| **Sensors** | expo-sensors (accelerometer for crash detection) |
| **SMS** | expo-sms (device) + Twilio (backup via Edge Function) |
| **Icons** | lucide-react-native |
| **State Mgmt** | React hooks + AsyncStorage persistence |

---

## Architecture

### Offline-First Design

Every external dependency has a progressive fallback chain:

```
Services:    Supabase RPC → AsyncStorage Cache → Seed Data (Goa)
AI Chat:     Local Gemma  → Groq Cloud API     → Hardcoded First-Aid Text
SMS:         Device SMS   → Twilio Edge Function
```

### Navigation Structure

```
RootLayout (Stack Navigator)
├── index           → Splash (redirects based on onboarding state)
├── onboarding      → 3-step profile setup
├── model-setup     → Offline AI model download
├── (tabs)          → Bottom Tab Navigator (4 tabs)
│   ├── home        → SOS dashboard, crash detection, quick dial
│   ├── services    → Nearby emergency services finder
│   ├── chat        → AI-powered emergency assistant
│   └── settings    → Profile, contacts, crash detection config
└── incident/[id]   → Post-SOS incident detail report
```

### Data Flow

- **No authentication** — device-based storage; no user accounts
- **AsyncStorage** for all persistent data (profile, contacts, cache, incidents)
- **Supabase** as optional cloud layer for services lookup and incident logging
- **Progressive enhancement** — Supabase/Groq are "best-effort"; app works fully offline

---

## Key Directories

| Directory | Purpose |
|---|---|
| `app/` | Expo Router pages (file-based routing) |
| `components/` | Reusable UI components (SOSButton, ChatBubble, etc.) |
| `hooks/` | Custom React hooks (crash detection, location, SOS flow) |
| `lib/` | Core services (Supabase, Groq, SMS, offline cache, local LLM) |
| `types/` | TypeScript interfaces & type definitions |
| `constants/` | Theme, colors, service type mappings |
| `supabase/` | Schema SQL, seed data, Edge Functions |

---

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI
- Android SDK (for Android build) or Xcode (for iOS)

### Environment Variables

Create a `.env` file (see `.env.example`):

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key
```

### Install & Run

```bash
npm install
npx expo start
```

### Build

```bash
# Android APK
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios --profile preview
```

---

## Target Audience

- **India** (emergency numbers 112, 108, 100, 1033)
- **Languages**: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi
- **Seed data**: Goa region emergency services

---

## License

Private / Proprietary — RoadSoS
