import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Activity,
  ArrowRight,
  Car,
  HeartPulse,
  LucideIcon,
  MapPin,
  Navigation,
  PersonStanding,
  Phone,
  Shield,
  Siren,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CountdownOverlay } from '../../components/CountdownOverlay';
import { SOSButton } from '../../components/SOSButton';
import { Avatar, Divider, GhostButton, Header, IconBadge, Panel, PrimaryButton, Screen, SectionTitle, StatusPill } from '../../components/AppKit';
import { Colors, ServiceTypeLabels, Spacing, Typography } from '../../constants/theme';
import { serviceVisual } from '../../constants/serviceVisuals';
import { tabContentPaddingBottom } from '../../constants/layout';
import { useCrashDetector } from '../../hooks/useCrashDetector';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyServices } from '../../hooks/useNearbyServices';
import { useSOSFlow } from '../../hooks/useSOSFlow';
import { getEmergencyContacts, getUserProfile, saveUserProfile } from '../../lib/offline-cache';
import {
  consumePendingCrash,
  fireCrashNotification,
  startBackgroundService,
  stopBackgroundService,
  storePendingCrash,
  updateServiceMode,
} from '../../lib/background-service';
import {
  isNativeCrashServiceAvailable,
  stopNativeVibration,
  storeContactsNative,
  storeLocationNative,
  storeUserNameNative,
  subscribeNativeCrashEvent,
} from '../../lib/native-crash-service';
import { logCrashDetected, resolveCrashLog } from '../../lib/crash-logger';
import { AppMode, CrashSensitivity, LocationData, NearbyService } from '../../types';

type HomeProfile = {
  name: string;
  crashDetectionEnabled: boolean;
  crashSensitivity: CrashSensitivity;
  appMode: AppMode;
  devMode: boolean;
};

type Tone = 'red' | 'green' | 'blue' | 'amber' | 'indigo' | 'neutral';

const QUICK_DIAL: { number: string; label: string; Icon: LucideIcon }[] = [
  { number: '112', label: 'Emergency', Icon: Siren },
  { number: '108', label: 'Ambulance', Icon: HeartPulse },
  { number: '100', label: 'Police', Icon: Shield },
  { number: '1033', label: 'Highway', Icon: Navigation },
];

function ModePill({
  Icon,
  label,
  tone,
  selected,
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  tone: 'blue' | 'green';
  selected: boolean;
  onPress: () => void;
}) {
  const color = tone === 'blue' ? Colors.infoBlue : Colors.safeGreen;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label} mode`}
      style={({ pressed }) => ({
        flex: 1,
        height: 46,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        borderWidth: 1,
        backgroundColor: selected ? `${color}1A` : Colors.surface2,
        borderColor: selected ? `${color}59` : Colors.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon size={18} color={selected ? color : Colors.textMuted} strokeWidth={2.2} />
      <Text style={{ fontSize: 14, fontWeight: '700', color: selected ? color : Colors.textMuted }}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { location, error: locationError, refresh: refreshLocation } = useLocation();
  const { services, isOffline, dataSource, refresh: refreshServices } = useNearbyServices(location?.lat ?? null, location?.lng ?? null);
  const { triggerSOS, isTriggering } = useSOSFlow();
  const [profile, setProfile] = useState<HomeProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationRef = useRef<LocationData | null>(null);
  const servicesRef = useRef<NearbyService[]>([]);
  const appState = useRef<AppStateStatus>('active');

  locationRef.current = location;
  servicesRef.current = services;

  const mode = profile?.appMode ?? 'normal';
  const isDrive = mode === 'drive';

  const { isCrashDetected, gForce, jerkGs, reset } = useCrashDetector(
    profile?.crashDetectionEnabled ?? false,
    mode,
    profile?.crashSensitivity ?? 'medium',
  );

  // Load profile on mount
  useEffect(() => {
    getUserProfile()
      .then((value) => {
        if (value) {
          setProfile({
            name: value.name,
            crashDetectionEnabled: value.crashDetectionEnabled,
            crashSensitivity: value.crashSensitivity,
            appMode: value.appMode ?? 'normal',
            devMode: value.devMode,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Sync location to native SharedPreferences so Kotlin can use it in background SOS
  useEffect(() => {
    if (!location) return;
    storeLocationNative(location.lat, location.lng, location.address ?? '').catch(() => {});
  }, [location]);

  // Sync user name + contacts to native SharedPreferences once on mount
  useEffect(() => {
    getUserProfile().then((p) => {
      if (p?.name) storeUserNameNative(p.name).catch(() => {});
    }).catch(() => {});
    getEmergencyContacts().then((contacts) => {
      storeContactsNative(contacts.map((c) => c.phone), contacts.map((c) => c.name)).catch(() => {});
    }).catch(() => {});
  }, []);

  // Manage background service based on crash detection state
  useEffect(() => {
    if (!profile) return;
    if (profile.crashDetectionEnabled) {
      startBackgroundService(mode, profile.crashSensitivity).catch(() => {});
    } else {
      stopBackgroundService().catch(() => {});
    }
  }, [profile?.crashDetectionEnabled, profile?.crashSensitivity, mode]);

  // Subscribe to live crash events from the native foreground service
  useEffect(() => {
    if (!isNativeCrashServiceAvailable || !profile?.crashDetectionEnabled) return;
    const unsub = subscribeNativeCrashEvent(() => {
      if (appState.current === 'active' && !countdownVisible) {
        logCrashDetected(mode, profile?.crashSensitivity ?? 'medium', gForce, jerkGs, locationRef.current).catch(() => {});
        setCountdown(15);
        setCountdownVisible(true);
      }
    });
    return unsub;
  }, [profile?.crashDetectionEnabled, countdownVisible, mode, gForce, jerkGs]);

  // Track AppState — when returning from background check for pending crash events
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      const prev = appState.current;
      appState.current = nextState;

      // App came back to foreground — check if native service stored a crash while hidden
      if (prev !== 'active' && nextState === 'active') {
        const hasPending = await consumePendingCrash();
        if (hasPending && !countdownVisible) {
          logCrashDetected(mode, profile?.crashSensitivity ?? 'medium', gForce, jerkGs, locationRef.current).catch(() => {});
          setCountdown(15);
          setCountdownVisible(true);
        }
      }
    });
    return () => sub.remove();
  }, [countdownVisible, mode, gForce, jerkGs]);

  const sendAutoSOS = useCallback(async () => {
    setCountdownVisible(false);
    reset();
    stopNativeVibration().catch(() => {});
    resolveCrashLog('sos_sent').catch(() => {});
    const currentLocation = locationRef.current;
    if (!currentLocation) {
      Alert.alert('Location unavailable', 'RoadSoS detected impact, but GPS is not ready. Call 112 if you need immediate help.');
      return;
    }
    await triggerSOS(currentLocation, 'auto', servicesRef.current);
  }, [reset, triggerSOS]);

  // Handle crash detection — log to Supabase, vibrate, show countdown or background alert
  useEffect(() => {
    if (!isCrashDetected || countdownVisible) return;

    // Always log to Supabase regardless of foreground/background
    logCrashDetected(
      mode,
      profile?.crashSensitivity ?? 'medium',
      gForce,
      jerkGs,
      locationRef.current,
    ).catch(() => {});

    if (appState.current !== 'active') {
      // In background: store pending crash + fire alert notification (native service already vibrated)
      storePendingCrash().catch(() => {});
      fireCrashNotification().catch(() => {});
    } else {
      setCountdown(15);
      setCountdownVisible(true);
    }
  }, [isCrashDetected, countdownVisible]);

  useEffect(() => {
    if (!countdownVisible) return;
    timerRef.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          sendAutoSOS();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdownVisible, sendAutoSOS]);

  async function onRefresh() {
    setRefreshing(true);
    await refreshLocation();
    await Promise.resolve(refreshServices());
    setRefreshing(false);
  }

  function cancelCountdown() {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdownVisible(false);
    setCountdown(15);
    reset();
    stopNativeVibration().catch(() => {});
    resolveCrashLog('cancelled').catch(() => {});
  }

  function confirmManualSOS() {
    const currentLocation = locationRef.current;
    if (!currentLocation) {
      Alert.alert('Location needed', 'Wait for GPS or enable location before sending SOS.');
      return;
    }
    Alert.alert('Send SOS?', 'RoadSoS will text your emergency contacts with your current location.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send SOS',
        style: 'destructive',
        onPress: () => triggerSOS(currentLocation, 'manual', servicesRef.current),
      },
    ]);
  }

  async function toggleMode(next: AppMode) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProfile((prev) => (prev ? { ...prev, appMode: next } : prev));
    // Persist + update background notification
    const stored = await getUserProfile();
    if (stored) await saveUserProfile({ ...stored, appMode: next });
    if (profile?.crashDetectionEnabled) updateServiceMode(next, profile?.crashSensitivity ?? 'medium').catch(() => {});
  }

  const initials = (profile?.name ?? '')
    .trim()
    .split(/\s+/)
    .map((item) => item[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const locationLine1 = location
    ? location.address ?? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
    : 'Waiting for location';
  const locationLine2 = location ? 'GPS signal locked' : locationError ?? 'Acquiring GPS signal';

  const detectionOn = profile?.crashDetectionEnabled ?? false;
  const crashTone: Tone = detectionOn ? (isDrive ? 'amber' : 'green') : 'neutral';
  const crashStat = detectionOn
    ? isDrive
      ? `${gForce.toFixed(1)}g · jerk ${jerkGs.toFixed(0)} g/s`
      : 'Idle · no anomalies'
    : 'Enable in Settings for automatic SOS';

  const nearest = services.slice(0, 3);

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Header
        title="RoadSoS"
        subtitle="Stay calm. We're with you."
        right={<Avatar initials={initials} onPress={() => router.push('/(tabs)/settings')} />}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: tabContentPaddingBottom(insets.bottom, Spacing.xxl) }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.sosRed} />}
      >
        {/* ── Mode toggle ───────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xxs, marginBottom: Spacing.sm }}>
          <ModePill Icon={Car} label="Drive" tone="blue" selected={isDrive} onPress={() => toggleMode('drive')} />
          <ModePill Icon={PersonStanding} label="Normal" tone="green" selected={!isDrive} onPress={() => toggleMode('normal')} />
        </View>

        {/* ── Location status ───────────────────────────────────────────── */}
        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
            <IconBadge Icon={MapPin} tone={location ? (isDrive ? 'blue' : 'green') : 'amber'} size={38} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 15, lineHeight: 20, fontWeight: '700' }} numberOfLines={1}>
                {locationLine1}
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: 12.5, lineHeight: 17, marginTop: 2 }} numberOfLines={1}>
                {locationLine2}
              </Text>
            </View>
            <StatusPill label={location ? 'GPS' : 'Pending'} tone={location ? 'green' : 'amber'} />
          </View>
        </Panel>

        {/* ── SOS button ────────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
          <SOSButton
            onPress={confirmManualSOS}
            disabled={isTriggering}
            accessibilityLabel="Send SOS alert"
            accessibilityHint="Asks for confirmation, then sends your location to saved contacts"
            accessibilityState={{ disabled: isTriggering }}
          />
          <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, textAlign: 'center', marginTop: Spacing.sm }}>
            {isTriggering ? 'Sending alert to contacts…' : 'Press once. Confirm once.'}
          </Text>
        </View>

        {/* ── Crash detection status ────────────────────────────────────── */}
        <Panel tone={crashTone} style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <IconBadge Icon={isDrive ? Zap : Activity} tone={crashTone} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 14, lineHeight: 19, fontWeight: '700' }}>
                {detectionOn ? (isDrive ? 'Drive crash detection' : 'Walk monitoring') : 'Crash detection off'}
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: 12, lineHeight: 16, marginTop: 1 }}>{crashStat}</Text>
            </View>
            <StatusPill label={detectionOn ? (isDrive ? 'Drive' : 'Normal') : 'Off'} tone={crashTone} />
          </View>
          {profile?.devMode ? (
            <PrimaryButton label="Simulate crash" tone="amber" Icon={Activity} onPress={() => setCountdownVisible(true)} />
          ) : null}
        </Panel>

        {/* ── Quick dial ────────────────────────────────────────────────── */}
        <SectionTitle label="Quick dial" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {QUICK_DIAL.map((item) => (
            <Panel key={item.number} style={{ width: '48%', gap: Spacing.xs }}>
              <IconBadge Icon={item.Icon} tone="red" size={34} />
              <View>
                <Text style={{ color: Colors.textPrimary, fontSize: 20, lineHeight: 25, fontWeight: '800' }}>{item.number}</Text>
                <Text style={{ color: Colors.textMuted, ...Typography.caption }}>{item.label}</Text>
              </View>
              <GhostButton
                label="Call"
                Icon={Phone}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Linking.openURL(`tel:${item.number}`);
                }}
                style={{ minHeight: 38 }}
              />
            </Panel>
          ))}
        </View>

        {/* ── Nearby help ───────────────────────────────────────────────── */}
        <SectionTitle label="Nearby help" action={<StatusPill label={isOffline ? 'Offline' : 'Live'} tone={isOffline ? 'amber' : 'green'} />} />
        <Panel padded={false}>
          {nearest.length === 0 ? (
            <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, padding: Spacing.md }}>
              Nearby services will appear once location is available.
            </Text>
          ) : (
            nearest.map((service, index) => {
              const vis = serviceVisual(service.service_type);
              return (
                <View key={service.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm }}>
                    <IconBadge Icon={vis.Icon} tone={vis.tone} size={34} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: Colors.textPrimary, fontSize: 14, lineHeight: 19, fontWeight: '700' }} numberOfLines={1}>
                        {service.name}
                      </Text>
                      <Text style={{ color: Colors.textMuted, ...Typography.caption }} numberOfLines={1}>
                        {ServiceTypeLabels[service.service_type] ?? 'Service'} · {service.distance_km.toFixed(1)} km
                      </Text>
                    </View>
                    <GhostButton
                      label="Call"
                      onPress={() => Linking.openURL(`tel:${service.primary_phone}`)}
                      style={{ minHeight: 36, paddingHorizontal: 16 }}
                    />
                  </View>
                  {index < nearest.length - 1 ? <Divider /> : null}
                </View>
              );
            })
          )}
          <Divider />
          <View style={{ padding: 10 }}>
            <GhostButton
              label="View all services"
              Icon={ArrowRight}
              tone="blue"
              onPress={() => router.push('/(tabs)/services')}
              style={{ minHeight: 40 }}
            />
          </View>
        </Panel>
      </ScrollView>

      <CountdownOverlay visible={countdownVisible} countdown={countdown} onCancel={cancelCountdown} onSendNow={sendAutoSOS} />
    </Screen>
  );
}
