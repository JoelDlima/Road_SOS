# Emergency Mode Battery Optimization

## Overview
Conserve battery when crash detection is active by reducing resource usage.

## Strategies Implemented
- [x] `useCrashDetector` already uses 100ms update interval — configurable
- [x] Settings toggle for Emergency Battery Mode (settings.tsx)
- [ ] Disable animations (reanimated) when battery mode is on
- [ ] Reduce accelerometer polling from 100ms to 500ms
- [ ] Disable location background updates
- [ ] Reduce map rendering quality
- [ ] Disable AI model loading until needed

## Future Enhancements
- Monitor battery level and auto-enable battery mode below 20%
- Use `expo-battery` to read battery level
- Adaptive polling: increase accelerometer interval when no motion detected for 30s
