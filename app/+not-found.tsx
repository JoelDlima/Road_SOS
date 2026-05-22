import React from 'react';
import { Stack, router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GhostButton, IconBadge, Panel, Screen } from '../components/AppKit';
import { Colors, Spacing, Typography } from '../constants/theme';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();
  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }}>
        <Panel style={{ alignItems: 'center', gap: Spacing.md, width: '100%' }}>
          <IconBadge Icon={Search} tone="red" size={74} />
          <Text style={{ color: Colors.textPrimary, ...Typography.h1, textAlign: 'center' }}>Screen not found</Text>
          <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, textAlign: 'center' }}>
            That RoadSoS route is not available on this device.
          </Text>
          <GhostButton label="Back to RoadSoS" tone="red" onPress={() => router.replace('/')} />
        </Panel>
      </View>
    </Screen>
  );
}
