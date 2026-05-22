import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Vibration } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { AppMode, CrashSensitivity } from '../types';

// ── Walk / Normal mode ───────────────────────────────────────────────────────
// Uses a direct magnitude threshold (g-units). Good for pedestrians because
// walking speeds produce predictable, low-magnitude acceleration (<1.8g steps).
// A hard fall produces a sudden 3–6g peak — easy to threshold against.
const WALK_THRESHOLDS_G: Record<CrashSensitivity, number> = {
  low: 4.0,    // severe falls / heavy impacts only
  medium: 3.0, // normal hard falls
  high: 2.2,   // any significant stumble or fall
};
const WALK_CONFIRM_MS = 150; // falls last slightly longer than vehicle crashes

// ── Drive mode ───────────────────────────────────────────────────────────────
// Uses THREE simultaneous conditions — all must hold to call it a crash.
// This prevents false positives from speed bumps, potholes, braking, etc.
//
// 1. JERK: rate-of-change of magnitude (g/s). Normal driving has smooth
//    acceleration changes. A crash produces magnitude that shoots up in < 50ms.
//    Speed bump at 40 km/h: jerk ~6-8 g/s. Crash at 40 km/h: jerk > 40 g/s.
//
// 2. EMA RATIO: current magnitude vs. a slow exponential moving average (α=0.08)
//    that tracks "normal driving conditions". The EMA adapts slowly, so it
//    stays near 1.1-1.2g during normal driving. A crash spike of 8g vs EMA 1.2g
//    gives ratio 6.7 — far above the threshold. A pothole spike of 2.8g vs
//    EMA 1.2g gives ratio 2.3 — below the threshold.
//
// 3. MINIMUM ABSOLUTE MAGNITUDE: rules out high-jerk but low-energy events
//    (e.g., phone dropped, sharp turn at low speed).
const DRIVE_THRESHOLDS = {
  low:    { jerkGs: 25, ratio: 5.0, minMagG: 3.5 }, // only high-speed severe crashes
  medium: { jerkGs: 15, ratio: 4.0, minMagG: 3.0 }, // typical crashes
  high:   { jerkGs: 10, ratio: 3.2, minMagG: 2.5 }, // lower-speed / motorcycle crashes
} satisfies Record<CrashSensitivity, { jerkGs: number; ratio: number; minMagG: number }>;
const DRIVE_CONFIRM_MS = 80; // crash impulse is fast — confirm quickly

// EMA smoothing factor. Lower = slower adaptation = harder to fool with gradual
// acceleration changes. 0.08 means it takes ~12 samples (600ms) to reflect
// a sudden sustained change — enough to stay well behind any crash spike.
const EMA_ALPHA = 0.08;

// Sensor polling: 50ms interval → 20 Hz. Gives good jerk resolution.
const UPDATE_INTERVAL_MS = 50;

export interface UseCrashDetectorResult {
  isCrashDetected: boolean;
  gForce: number;
  jerkGs: number;
  reset: () => void;
}

export function useCrashDetector(
  enabled: boolean,
  mode: AppMode = 'normal',
  sensitivity: CrashSensitivity = 'medium',
): UseCrashDetectorResult {
  const [isCrashDetected, setIsCrashDetected] = useState(false);
  const [gForce, setGForce] = useState(0);
  const [jerkGs, setJerkGs] = useState(0);

  // Mutable refs — updated every sensor tick without causing re-renders.
  const impactStart = useRef<number | null>(null);
  const prevMagnitude = useRef(1.0);   // starts at 1g (phone lying flat = gravity)
  const emaRef = useRef(1.0);          // exponential moving average of magnitude
  const prevTimestamp = useRef(Date.now());
  const displayGRef = useRef(0);
  const displayJerkRef = useRef(0);
  const appState = useRef<AppStateStatus>('active');

  const reset = useCallback(() => {
    setIsCrashDetected(false);
    Vibration.cancel();
    impactStart.current = null;
  }, []);

  // Track app foreground/background state so we know what the device is doing.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    try {
      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);

      const driveCfg = DRIVE_THRESHOLDS[sensitivity];
      const walkThresholdG = WALK_THRESHOLDS_G[sensitivity];

      const sub = Accelerometer.addListener(({ x, y, z }) => {
        if (x == null || y == null || z == null) return;

        const now = Date.now();
        // Clamp dt so a timer hiccup (app re-foreground, GC pause) can't produce
        // a massive fake jerk spike from a large dt denominator.
        const dtSeconds = Math.min(Math.max((now - prevTimestamp.current) / 1000, 0.01), 0.5);
        prevTimestamp.current = now;

        const magnitude = Math.sqrt(x * x + y * y + z * z); // in g-units (Expo Accelerometer)

        // Update EMA baseline (slow tracker)
        emaRef.current = EMA_ALPHA * magnitude + (1 - EMA_ALPHA) * emaRef.current;

        // Compute jerk (g/s)
        const jerk = Math.abs(magnitude - prevMagnitude.current) / dtSeconds;
        prevMagnitude.current = magnitude;

        // Throttle UI display updates to avoid flooding React reconciler
        const roundedG = Math.round(magnitude * 10) / 10;
        const roundedJerk = Math.round(jerk * 10) / 10;
        if (Math.abs(roundedG - displayGRef.current) > 0.2) {
          displayGRef.current = roundedG;
          setGForce(roundedG);
        }
        if (Math.abs(roundedJerk - displayJerkRef.current) > 0.5) {
          displayJerkRef.current = roundedJerk;
          setJerkGs(roundedJerk);
        }

        // ── Crash condition check ───────────────────────────────────────────
        let isCrash = false;

        if (mode === 'drive') {
          const ratio = magnitude / Math.max(emaRef.current, 0.5);
          isCrash =
            magnitude > driveCfg.minMagG &&
            ratio > driveCfg.ratio &&
            jerk > driveCfg.jerkGs;
        } else {
          // Normal / walk mode — simple magnitude threshold
          isCrash = magnitude > walkThresholdG;
        }

        const confirmMs = mode === 'drive' ? DRIVE_CONFIRM_MS : WALK_CONFIRM_MS;

        if (isCrash) {
          if (impactStart.current === null) {
            impactStart.current = now;
          } else if (now - impactStart.current >= confirmMs) {
            setIsCrashDetected(true);
            Vibration.vibrate([0, 500, 200, 500, 200, 500]);
            impactStart.current = null;
          }
        } else {
          impactStart.current = null;
        }
      });

      return () => sub.remove();
    } catch {
      // Accelerometer unavailable on this device (emulators, some tablets)
      return;
    }
  }, [enabled, mode, sensitivity]);

  return { isCrashDetected, gForce, jerkGs, reset };
}
