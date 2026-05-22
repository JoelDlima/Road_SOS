import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, Ambulance, Car, MapPin, Navigation, PersonStanding, Phone, Shield, Siren, User, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CountdownOverlay } from '../../components/CountdownOverlay';
import { SOSButton } from '../../components/SOSButton';
import { GhostButton, Header, IconBadge, Panel, PrimaryButton, Screen, SectionTitle, StatusPill } from '../../components/AppKit';
import { Colors, ServiceTypeLabels, Spacing, Typography } from '../../constants/theme';
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

const QUICK_DIAL = [
  { number: '112', label: 'Emergency', tone: 'red' as const, Icon: Siren },
  { number: '108', label: 'Ambulance', tone: 'amber' as const, Icon: Ambulance },
  { number: '100', label: 'Police', tone: 'indigo' as const, Icon: Shield },
  { number: '1033', label: 'Highway', tone: 'blue' as const, Icon: Navigation },
];

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

  const initials = profile?.name
    ?.trim()
    .split(/\s+/)
    .map((item) => item[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const locationLabel =
    location?.address ??
    (location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : locationError ?? 'Acquiring GPS signal');

  const nearest = services.slice(0, 3);

  // Drive mode stat display (jerk is the key indicator)
  const driveStatLabel = mode === 'drive'
    ? `${gForce.toFixed(1)}g  ·  jerk ${jerkGs.toFixed(0)} g/s`
    : `${gForce.toFixed(1)}g impact force`;

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Header
        title="RoadSoS"
        subtitle={
          !location ? 'Preparing location services' :
          mode === 'drive' && profile?.crashDetectionEnabled ? 'Drive mode · monitoring active' :
          mode === 'drive' ? 'Drive mode' :
          'Emergency cockpit ready'
        }
        right={
          <GhostButton
            label={initials || 'Me'}
            tone="neutral"
            Icon={User}
            onPress={() => router.push('/(tabs)/settings')}
            style={{ minHeight: 42 }}
          />
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: tabContentPaddingBottom(insets.bottom, Spacing.xxl) }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.sosRed} />}
      >
        {/* ── Mode toggle ───────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
          <Pressable
            onPress={() => toggleMode('drive')}
            accessibilityRole="radio"
            accessibilityLabel="Drive Mode"
            accessibilityState={{ checked: mode === 'drive' }}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.xs,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1.5,
              backgroundColor: mode === 'drive' ? `${Colors.infoBlue}18` : Colors.surface,
              borderColor: mode === 'drive' ? Colors.infoBlue : Colors.border,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Car size={18} color={mode === 'drive' ? Colors.infoBlue : Colors.textMuted} strokeWidth={2} />
            <Text style={{
              ...Typography.bodySmall,
              fontWeight: '700',
              color: mode === 'drive' ? Colors.infoBlue : Colors.textMuted,
            }}>
              Drive Mode
            </Text>
          </Pressable>

          <Pressable
            onPress={() => toggleMode('normal')}
            accessibilityRole="radio"
            accessibilityLabel="Normal Mode"
            accessibilityState={{ checked: mode === 'normal' }}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.xs,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1.5,
              backgroundColor: mode === 'normal' ? `${Colors.safeGreen}18` : Colors.surface,
              borderColor: mode === 'normal' ? Colors.safeGreen : Colors.border,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <PersonStanding size={18} color={mode === 'normal' ? Colors.safeGreen : Colors.textMuted} strokeWidth={2} />
            <Text style={{
              ...Typography.bodySmall,
              fontWeight: '700',
              color: mode === 'normal' ? Colors.safeGreen : Colors.textMuted,
            }}>
              Normal Mode
            </Text>
          </Pressable>
        </View>

        {/* ── Location status ───────────────────────────────────────────── */}
        <Panel tone={location ? 'green' : 'amber'} style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <IconBadge Icon={MapPin} tone={location ? 'green' : 'amber'} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }}>
                {location ? 'Location locked' : 'Waiting for location'}
              </Text>
              <Text style={{ color: Colors.textMuted, ...Typography.caption, marginTop: 2 }} numberOfLines={2}>
                {locationLabel}
              </Text>
            </View>
            <StatusPill label={location ? 'GPS' : 'Pending'} tone={location ? 'green' : 'amber'} />
          </View>
        </Panel>

        {/* ── SOS button ────────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <SOSButton
            onPress={confirmManualSOS}
            disabled={isTriggering}
            accessibilityLabel="Send SOS alert"
            accessibilityHint="Asks for confirmation, then sends your location to saved contacts"
            accessibilityState={{ disabled: isTriggering }}
          />
          <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, textAlign: 'center', marginTop: Spacing.sm }}>
            {isTriggering ? 'Sending alert to contacts...' : 'Press once. Confirm once. RoadSoS handles the rest.'}
          </Text>
        </View>

        {/* ── Crash detection status ────────────────────────────────────── */}
        <Panel tone={profile?.crashDetectionEnabled ? (mode === 'drive' ? 'amber' : 'green') : 'neutral'} style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <IconBadge
              Icon={mode === 'drive' ? Zap : Activity}
              tone={profile?.crashDetectionEnabled ? (mode === 'drive' ? 'amber' : 'green') : 'neutral'}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }}>
                {profile?.crashDetectionEnabled
                  ? `${mode === 'drive' ? 'Drive' : 'Normal'} crash detection active`
                  : 'Crash detection off'}
              </Text>
              <Text style={{ color: Colors.textMuted, ...Typography.caption, marginTop: 2 }}>
                {profile?.crashDetectionEnabled
                  ? driveStatLabel
                  : 'Enable in Profile for automatic SOS.'}
              </Text>
            </View>
            <StatusPill
              label={profile?.crashDetectionEnabled ? (mode === 'drive' ? 'Drive' : 'On') : 'Off'}
              tone={profile?.crashDetectionEnabled ? (mode === 'drive' ? 'amber' : 'green') : 'neutral'}
            />
          </View>
          {profile?.devMode ? (
            <PrimaryButton label="Simulate crash" tone="amber" Icon={Activity} onPress={() => setCountdownVisible(true)} />
          ) : null}
        </Panel>

        {/* ── Quick dial ────────────────────────────────────────────────── */}
        <SectionTitle label="Quick dial" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {QUICK_DIAL.map((item) => (
            <Panel key={item.number} tone={item.tone} style={{ width: '48%', gap: Spacing.sm }}>
              <IconBadge Icon={item.Icon} tone={item.tone} />
              <View>
                <Text style={{ color: Colors.textPrimary, fontSize: 24, lineHeight: 30, fontWeight: '900' }}>{item.number}</Text>
                <Text style={{ color: Colors.textMuted, ...Typography.caption }}>{item.label}</Text>
              </View>
              <GhostButton
                label="Call"
                tone={item.tone}
                Icon={Phone}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Linking.openURL(`tel:${item.number}`);
                }}
              />
            </Panel>
          ))}
        </View>

        {/* ── Nearby help ───────────────────────────────────────────────── */}
        <SectionTitle
          label="Nearby help"
          action={<StatusPill label={isOffline ? 'Offline data' : dataSource} tone={isOffline ? 'amber' : 'green'} />}
        />
        <Panel style={{ gap: Spacing.sm }}>
          {nearest.length === 0 ? (
            <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>
              Nearby services will appear once location is available.
            </Text>
          ) : (
            nearest.map((service) => (
              <View key={service.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }} numberOfLines={1}>
                    {service.name}
                  </Text>
                  <Text style={{ color: Colors.textMuted, ...Typography.caption }} numberOfLines={1}>
                    {ServiceTypeLabels[service.service_type]} — {service.distance_km.toFixed(1)} km
                  </Text>
                </View>
                <GhostButton label="Call" tone="green" Icon={Phone} onPress={() => Linking.openURL(`tel:${service.primary_phone}`)} />
              </View>
            ))
          )}
          <GhostButton label="Open services map" tone="blue" Icon={MapPin} onPress={() => router.push('/(tabs)/services')} />
        </Panel>
      </ScrollView>

      <CountdownOverlay visible={countdownVisible} countdown={countdown} onCancel={cancelCountdown} onSendNow={sendAutoSOS} />
    </Screen>
  );
}
