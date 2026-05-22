# Alarm Sound File

The app attempts to load `assets/alarm.wav` for the crash countdown siren.

## If the alarm doesn't play:
The `lib/alarm.ts` now generates a programmatic 880Hz beep tone as a fallback, so no external file is strictly required.

## To use a custom siren sound:
1. Download a short siren/alarm WAV file (mono, 8000Hz sample rate recommended)
2. Save it as `assets/alarm.wav`
3. Rebuild the app: `npx expo run:android` or `npx expo run:ios`

The programmatic beep will play automatically if no file is present.
