# RoadSoS Watch Companion Apps

## Apple Watch (watchOS)
Location: `watch/ios/RoadSoS Watch/`

### Features
- One-tap SOS button with haptic feedback
- Heart rate monitoring (via HealthKit)
- ICE (In Case of Emergency) info display
- Phone connection indicator
- Last SOS timestamp

### Setup
1. Open `ios/RoadSoS.xcworkspace` in Xcode
2. Add the watch target: File > New > Target > watchOS > Watch App
3. Copy the Swift files from `watch/ios/` into the new target
4. Enable HealthKit capability for heart rate
5. Set up App Groups for data sharing: `group.roadsos`
6. Build and run on paired Apple Watch

### Communication
Uses `WatchConnectivity` framework to communicate with the iPhone app.
The phone app updates shared `UserDefaults` (App Group) with ICE data.
Watch sends SOS triggers via `sendMessage`.

---

## Wear OS (Android)
Location: `watch/android/`

### Features
- One-tap SOS button
- Heart rate monitoring (via Health Services API)
- ICE info display
- Phone connection status

### Setup
1. Open the `watch/android/` directory in Android Studio
2. Sync Gradle and build
3. Run on Wear OS emulator or device

### Communication
Uses Wearable Data Layer API (MessageClient) to communicate with the phone app.
Phone sends ICE data via `DataClient`; watch sends SOS triggers via `MessageClient`.

---

## Phone Bridge
The `lib/watch-bridge.ts` module provides a unified API for both platforms.
Call `syncICEDataToWatch()` from the Settings screen when profile is updated.
Call `isWatchAvailable()` to check if a watch is connected.
