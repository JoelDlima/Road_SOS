# Video/Audio Streaming to Emergency Contacts

## Overview
Stream live video/audio from the user's phone to emergency contacts during an SOS.

## Architecture
- **WebRTC** for P2P video/audio streaming
- **expo-camera** for camera access
- **TURN server** (e.g., Twilio or Coturn) for NAT traversal
- Link shared via SMS: contacts open a web page to view stream

## Implementation
1. Create a `useVideoStream` hook that manages camera + WebRTC peer connection
2. On SOS trigger, generate a streaming room ID
3. Share the room link via SMS alongside location
4. Web dashboard shows the live stream using a WebRTC-compatible player
5. Fallback: send periodic photo snapshots if streaming fails

## Dependencies
- `expo-camera` — already available in Expo SDK
- `react-native-webrtc` — needs to be added
