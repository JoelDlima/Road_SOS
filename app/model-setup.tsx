import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle, Cpu, MessageCircle, Shield, ShieldCheck, WifiOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GhostButton, Header, IconBadge, Panel, PrimaryButton, Screen } from '../components/AppKit';
import { ModelDownloader } from '../components/ModelDownloader';
import { Colors, Spacing, Typography } from '../constants/theme';
import { getModelState, ModelVariant } from '../lib/local-llm';

const FEATURES = [
  { label: 'Fine-tuned for India', body: 'Trained on 210+ road-safety scenarios: traffic laws, crash response, first aid, and emergency numbers.', Icon: ShieldCheck },
  { label: 'Fully offline', body: 'Works in tunnels, no-signal zones, and network outages — no SIM needed.', Icon: WifiOff },
  { label: 'Instant answers', body: 'Short, numbered steps for crash, fire, breakdown, and medical emergencies.', Icon: MessageCircle },
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
      <Header title="Offline AI" subtitle="Optional on-device emergency guidance" showBack fallback="/onboarding" />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl }} showsVerticalScrollIndicator={false}>
        <Panel tone="indigo" style={{ gap: Spacing.md }}>
          <IconBadge Icon={Cpu} tone="indigo" size={58} />
          <View style={{ gap: 4 }}>
            <Text style={{ color: Colors.textPrimary, ...Typography.h1 }}>Fine-tuned for Indian roads</Text>
            <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>
              RoadSoS 3B is trained on 210+ road-safety scenarios. Download once — works fully offline, even without a SIM.
            </Text>
          </View>
        </Panel>

        <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
          {FEATURES.map((item) => (
            <Panel key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <IconBadge Icon={item.Icon} tone="blue" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }}>{item.label}</Text>
                <Text style={{ color: Colors.textMuted, ...Typography.caption }}>{item.body}</Text>
              </View>
            </Panel>
          ))}
        </View>

        <View style={{ height: Spacing.lg }} />
        {ready ? (
          <Panel tone="green" style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <IconBadge Icon={CheckCircle} tone="green" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }}>Model ready</Text>
                <Text style={{ color: Colors.textMuted, ...Typography.caption }}>Offline AI is already configured on this device.</Text>
              </View>
            </View>
            <PrimaryButton label="Continue to RoadSoS" tone="green" onPress={() => router.replace('/(tabs)')} />
          </Panel>
        ) : (
          <>
            <ModelDownloader onComplete={complete} onSkip={skip} />
            <GhostButton label="Continue without model" onPress={() => router.replace('/(tabs)')} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
