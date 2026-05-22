# Feature Specification: SOS Alerting

## Overview

The SOS Alerting feature is the core emergency mechanism of RoadSoS. It enables users to trigger an emergency alert — either manually via a button press or automatically via crash detection — which notifies emergency contacts via dual-channel SMS and broadcasts to nearby responders in real-time.

---

## EARS-Format Requirements

### 1. Ubiquitous (Always-On)

```
REQ-1.1  The mobile app SHALL display a large SOS button on the home screen
         at all times when the app is in the foreground.

REQ-1.2  The crash detection service SHALL run in the background after the user
         completes onboarding and enables crash detection.

REQ-1.3  The app SHALL monitor device accelerometer data at 50ms intervals when
         crash detection is enabled.
```

### 2. Event-Driven (When Triggered)

```
REQ-2.1  WHEN the user taps the SOS button
         THEN a confirmation dialog SHALL appear
         AND the button SHALL NOT trigger immediately.

REQ-2.2  WHEN the user confirms the SOS dialog
         THEN an incident record SHALL be created locally
         AND SMS alerts SHALL be sent to all registered emergency contacts
         AND the SOS event SHALL be broadcast via WebSocket to the Responder Server.

REQ-2.3  WHEN crash detection detects acceleration exceeding the sensitivity threshold
         THEN a 15-second countdown overlay SHALL appear
         AND the user SHALL have the option to cancel the alert.

REQ-2.4  WHEN the 15-second crash countdown reaches zero without cancellation
         THEN an automatic SOS SHALL be dispatched
         AND the trigger type SHALL be recorded as "auto".

REQ-2.5  WHEN an SOS is triggered (manual or auto)
         THEN the app SHALL record the GPS coordinates at the time of trigger.

REQ-2.6  WHEN device SMS sending fails for any contact
         THEN the app SHALL attempt delivery via the Supabase Edge Function (Twilio).

REQ-2.7  WHEN an SMS is delivered via either channel
         THEN the per-contact delivery status SHALL be updated
         AND a checkmark indicator SHALL be displayed on the incident screen.
```

### 3. Unwanted (Error Handling)

```
REQ-3.1  WHEN the device has no cellular signal AND no internet connectivity
         THEN the app SHALL display "No Signal — SMS may be delayed"
         AND SHALL continue to attempt delivery when connectivity resumes.

REQ-3.2  WHEN the user denies location permissions
         THEN the SOS SHALL still trigger
         AND SHALL record "location unavailable" in the incident report.

REQ-3.3  WHEN multiple rapid accelerometer events occur within 100ms
         THEN they SHALL be debounced to prevent duplicate crash detection triggers.

REQ-3.4  WHEN app is in the background AND crash detection is disabled
         THEN no accelerometer monitoring SHALL occur.

REQ-3.5  WHEN the SOS confirmation dialog is dismissed or cancelled
         THEN no alert SHALL be sent
         AND the home screen SHALL be restored.
```

### 4. State-Driven (System Modes)

```
REQ-4.1  WHILE an SOS is active (not yet resolved)
         THEN the home screen SHALL display the incident detail view
         AND SHALL show per-contact SMS delivery status
         AND SHALL show quick-dial emergency number buttons.

REQ-4.2  WHILE crash detection sensitivity is set to "Low"
         THEN the threshold SHALL be 25 m/s².

REQ-4.3  WHILE crash detection sensitivity is set to "Medium" (default)
         THEN the threshold SHALL be 20 m/s².

REQ-4.4  WHILE crash detection sensitivity is set to "High"
         THEN the threshold SHALL be 15 m/s².

REQ-4.5  WHILE dev mode is enabled
         THEN a simulated crash can be triggered from settings
         AND real contacts SHALL NOT be notified (test mode).
```

### 5. Optional (May Have)

```
REQ-5.1  The app MAY support up to 3 emergency contacts.

REQ-5.2  The SMS message body MAY include the user's name, blood group,
         GPS coordinates (as Google Maps link), and a timestamp.

REQ-5.3  The crash detection service MAY be toggled on/off from the Settings screen.

REQ-5.4  The SOS button animation MAY pulse at 1-second intervals to draw attention.
```

---

## Acceptance Criteria

### AC-1: Manual SOS Flow

```
GIVEN the user is on the home screen
 WHEN the user taps the SOS button
 THEN a confirmation dialog appears with "Send SOS?" and "Cancel" options
 WHEN the user taps "Send SOS"
 THEN the button animates to a confirmed state
 AND an incident is created with trigger_type = "manual"
 AND SMS is sent to all contacts
 AND the incident view is displayed
```

### AC-2: Crash Detection Flow

```
GIVEN crash detection is enabled at Medium sensitivity
 WHEN accelerometer readings exceed 20 m/s²
 THEN a 15-second countdown overlay appears
 AND a cancel button is visible
 WHEN the user taps cancel within 15 seconds
 THEN no alert is sent
 AND the home screen returns
 WHEN 15 seconds elapse without cancellation
 THEN an automatic SOS is dispatched with trigger_type = "auto"
```

### AC-3: Dual-Channel SMS Delivery

```
GIVEN the user has 2 emergency contacts
 WHEN an SOS is triggered
 THEN the app attempts device SMS to contact 1
 AND to contact 2
 WHEN device SMS fails for contact 1
 THEN the app sends via Twilio (Supabase Edge Function)
 AND the delivery status shows "Backup" for contact 1
 AND "Device" for contact 2
```

### AC-4: Offline Operation

```
GIVEN the device is offline (no cellular, no internet)
 WHEN the user triggers an SOS
 THEN the incident is saved locally
 THEN SMS delivery via device SMS is attempted (if signal exists)
 WHEN no signal exists
 THEN the app displays "SMS pending — will retry"
 WHEN signal is restored
 THEN pending SMS alerts are delivered
 AND the incident syncs to Supabase
```

### AC-5: Crash Sensitivity Levels

```
GIVEN crash detection sensitivity is set to "Low"
 WHEN acceleration reaches 22 m/s²
 THEN no crash alert is triggered

GIVEN crash detection sensitivity is set to "High"
 WHEN acceleration reaches 16 m/s²
 THEN a crash alert is triggered
```

### AC-6: Dev Mode Simulation

```
GIVEN dev mode is enabled in Settings
 WHEN the user triggers "Simulate Crash" 
 THEN the crash countdown appears
 AND no real messages are sent to contacts
 AND the incident is marked with "test_mode = true"
```

---

## UI Mockup Reference

### Home Screen (Idle)

```
┌──────────────────────────────┐
│  [Status Bar: LIVE / OFFLINE] │
│                              │
│         [Logo]               │
│                              │
│    ┌──────────────────┐      │
│    │                  │      │
│    │      SOS         │      │
│    │   (pulsing)      │      │
│    │                  │      │
│    └──────────────────┘      │
│                              │
│  Quick Dial: 112 108 100    │
│                              │
│  Crash Detection: [ON]      │
└──────────────────────────────┘
```

### SOS Confirmation Dialog

```
┌──────────────────────────────┐
│   ⚠ Send Emergency Alert?   │
│                              │
│   This will notify your      │
│   2 emergency contacts.      │
│                              │
│       [Cancel] [Send SOS]    │
└──────────────────────────────┘
```

### Crash Countdown Overlay

```
┌──────────────────────────────┐
│                              │
│   ⚠ Crash detected!         │
│                              │
│         ⏱ 12                │
│                              │
│   SOS will be sent in 3...   │
│                              │
│      [Cancel Alert]          │
│                              │
└──────────────────────────────┘
```

### Active Incident View

```
┌──────────────────────────────┐
│  ← Back    [Resolved]        │
│                              │
│  ⚠ INCIDENT ACTIVE           │
│  ID: #A3F8                   │
│  Type: Manual at 14:32       │
│                              │
│  Location:                   │
│  📍 15.2993, 74.1230        │
│  [Share Location]            │
│                              │
│  SMS Delivery:               │
│  ✅ Mom (Device)             │
│  ✅ Dad (Backup)             │
│  ❌ Friend (Pending)         │
│                              │
│  Quick Dial:                 │
│  [112] [108] [100] [1033]   │
└──────────────────────────────┘
```

---

## Implementation Checklist

### Primitives & Dependencies
- [ ] `expo-sms` installed and configured
- [ ] Supabase Edge Function for Twilio SMS (deployed)
- [ ] `expo-sensors` for accelerometer access
- [ ] `expo-task-manager` for background task registration
- [ ] AsyncStorage / local SQLite for offline incident storage
- [ ] WebSocket client connected to Responder Server

### SOS Button
- [ ] Large pulsing animated SOS button component
- [ ] Confirmation dialog with "Cancel" / "Send SOS"
- [ ] Debounce to prevent double-tap
- [ ] Haptic feedback on tap

### Crash Detection
- [ ] Accelerometer subscription at 50ms interval
- [ ] Configurable sensitivity thresholds (15/20/25 m/s²)
- [ ] 100ms debounce filter
- [ ] 15-second countdown overlay component
- [ ] Cancel action within countdown window
- [ ] Dev mode simulation trigger

### SMS Delivery
- [ ] Device SMS via expo-sms to all contacts
- [ ] Per-contact delivery status tracking
- [ ] Twilio fallback via Supabase Edge Function
- [ ] Retry queue for failed deliveries
- [ ] Checkmark UI for delivery status

### Incident Management
- [ ] Local incident model (id, trigger_type, location, timestamp, sms_status)
- [ ] Supabase incident sync (when online)
- [ ] Incident detail view with all required data
- [ ] Share location button (share sheet / clipboard)

### WebSocket Integration
- [ ] Connect to Responder Server on SOS trigger
- [ ] Send `sos-triggered` message with incident details
- [ ] Handle `sos-resolved` acknowledgment

### Offline Resilience
- [ ] Incident saved to local storage before any network call
- [ ] Failed SMS in retry queue with backoff
- [ ] Incident sync to Supabase when connectivity restored
- [ ] "No Signal" banner when offline

### Crash Sensitivity Settings
- [ ] Slider/selector: Low / Medium / High
- [ ] Persist preference to AsyncStorage
- [ ] Apply threshold to accelerometer listener
