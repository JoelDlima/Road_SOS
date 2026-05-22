# Apple Watch / Wear OS Companion App

## Overview
A companion watch app for quick SOS trigger and health data.

## Features
- **SOS button** on watch face (complication)
- **Heart rate monitoring** — auto-trigger SOS if heart rate drops suddenly after crash detection
- **Fall detection** using watch accelerometer (higher accuracy than phone)
- **Haptic feedback** on watch when crash detected
- **Display I.C.E. info** on watch screen

## Implementation (Apple Watch)
- WatchKit app with SwiftUI
- Phone app uses WatchConnectivity to receive SOS triggers
- HealthKit for heart rate data
- Haptics via WKInterfaceDevice

## Implementation (Wear OS)
- Jetpack Compose for Wear OS
- Health Services API for heart rate
- DataLayer API for phone communication
