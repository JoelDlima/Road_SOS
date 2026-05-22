import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '../constants/theme';

export default function Index() {
  useEffect(() => {
    let active = true;

    async function decideRoute() {
      try {
        const raw = await AsyncStorage.getItem('roadsos_user_profile');
        const profile = raw ? JSON.parse(raw) : null;
        if (!active) return;
        router.replace(profile?.onboardingComplete ? '/(tabs)' : '/onboarding');
      } catch {
        if (active) router.replace('/onboarding');
      }
    }

    const fallback = setTimeout(() => {
      if (active) router.replace('/onboarding');
    }, 2500);

    decideRoute().finally(() => clearTimeout(fallback));

    return () => {
      active = false;
      clearTimeout(fallback);
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
      <View
        style={{
          width: 82,
          height: 82,
          borderRadius: 41,
          backgroundColor: `${Colors.sosRed}16`,
          borderWidth: 1,
          borderColor: `${Colors.sosRed}44`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.lg,
        }}
      >
        <Text style={{ color: Colors.sosRed, fontSize: 22, lineHeight: 28, fontWeight: '900' }}>SOS</Text>
      </View>
      <Text style={{ color: Colors.textPrimary, ...Typography.h1 }}>RoadSoS</Text>
      <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, marginTop: 6, marginBottom: Spacing.lg }}>
        Preparing emergency tools
      </Text>
      <ActivityIndicator accessibilityLabel="Loading RoadSoS" color={Colors.sosRed} />
    </View>
  );
}
