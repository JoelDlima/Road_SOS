import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, CheckCircle, Cpu, MessageCircle, ShieldCheck, WifiOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GhostButton, Header, IconBadge, Panel, PrimaryButton, Screen } from '../components/AppKit';
import { ModelDownloader } from '../components/ModelDownloader';
import { Colors, Spacing, Typography } from '../constants/theme';
import { getModelState, ModelVariant } from '../lib/local-llm';

const FEATURES = [
  { t: 'Fine-tuned', s: '210+ road-safety Q&A pairs', Icon: ShieldCheck, tone: 'green' as const },
  { t: 'Fully offline', s: 'No internet needed after download', Icon: WifiOff, tone: 'indigo' as const },
  { t: 'Instant', s: 'Under 2s response time on device', Icon: MessageCircle, tone: 'blue' as const },
];

export default function ModelSetup() {
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getModelState().then((state) => setReady(state === 'ready')).catch(() => {});
  }, []);

  function complete(_variant: ModelVariant) {
    router.replace('/(tabs)');
  }

  function skip() {
    Alert.alert('Skip offline AI?', 'RoadSoS will still use cloud AI when configured and deterministic offline first-aid when not.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Skip', onPress: () => router.replace('/(tabs)') },
    ]);
  }

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Header title="Offline AI" subtitle="Optional on-device guidance" showBack fallback="/onboarding" />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Panel tone="indigo" style={{ alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.xs }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: `${Colors.indigoAccent}24`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.xs,
            }}
          >
            <Cpu size={32} color={Colors.indigoAccent} />
          </View>
          <Text style={{ color: Colors.textPrimary, fontSize: 20, lineHeight: 26, fontWeight: '800' }}>Offline AI Assistant</Text>
          <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>Fine-tuned for Indian roads</Text>
        </Panel>

        {/* Feature list */}
        <View style={{ gap: Spacing.xs, marginTop: Spacing.md }}>
          {FEATURES.map((item) => (
            <Panel key={item.t} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <IconBadge Icon={item.Icon} tone={item.tone} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.textPrimary, fontSize: 14, lineHeight: 19, fontWeight: '700' }}>{item.t}</Text>
                <Text style={{ color: Colors.textMuted, ...Typography.caption }}>{item.s}</Text>
              </View>
            </Panel>
          ))}
        </View>

        {/* Model card — red accent bar + TRAINED badge */}
        <View
          style={{
            marginTop: Spacing.sm,
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 12,
            padding: Spacing.sm,
            paddingLeft: Spacing.md,
            overflow: 'hidden',
          }}
        >
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: Colors.sosRed }} />
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              backgroundColor: `${Colors.sosRed}1F`,
            }}
          >
            <Text style={{ color: Colors.sosRed, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>TRAINED</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <ShieldCheck size={18} color={Colors.sosRed} />
            <Text style={{ color: Colors.textPrimary, fontSize: 15, lineHeight: 20, fontWeight: '800' }}>RoadSoS 3B</Text>
          </View>
          <Text style={{ color: Colors.textMuted, ...Typography.caption }}>Fine-tuned · 210+ Q&amp;A · ~2.0 GB</Text>
        </View>

        {/* Storage warning */}
        <Panel tone="amber" style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm }}>
          <AlertTriangle size={18} color={Colors.warningAmber} />
          <Text style={{ color: Colors.textMuted, ...Typography.caption, flex: 1 }}>
            <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>~2 GB free storage</Text> required. Wi-Fi recommended.
          </Text>
        </Panel>

        <View style={{ height: Spacing.md }} />
        {ready ? (
          <Panel tone="green" style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <IconBadge Icon={CheckCircle} tone="green" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }}>Model ready</Text>
                <Text style={{ color: Colors.textMuted, ...Typography.caption }}>RoadSoS 3B is installed and ready.</Text>
              </View>
            </View>
            <PrimaryButton label="Continue to RoadSoS" tone="green" onPress={() => router.replace('/(tabs)')} />
          </Panel>
        ) : (
          <>
            <ModelDownloader onComplete={complete} onSkip={skip} />
            <GhostButton label="Skip — use cloud AI instead" onPress={() => router.replace('/(tabs)')} style={{ marginTop: Spacing.sm }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
