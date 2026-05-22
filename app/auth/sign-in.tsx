import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GhostButton, Header, IconBadge, Panel, PrimaryButton, Screen, TextField } from '../../components/AppKit';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { signIn } from '../../lib/auth';
import { validateEmail } from '../../lib/validators';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      Alert.alert('Invalid email', emailResult.error ?? 'Enter a valid email.');
      return;
    }
    if (!password) {
      Alert.alert('Password required', 'Enter your account password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Header title="Sign in" subtitle="Optional cloud sync for your emergency profile" showBack />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Panel tone="blue" style={{ gap: Spacing.md }}>
            <IconBadge Icon={User} tone="blue" size={58} />
            <View>
              <Text style={{ color: Colors.textPrimary, ...Typography.h1 }}>Welcome back</Text>
              <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, marginTop: 4 }}>
                Sync contacts and profile data across devices. RoadSoS still works offline without an account.
              </Text>
            </View>
            <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={submit}
            />
            <GhostButton label={showPassword ? 'Hide password' : 'Show password'} Icon={showPassword ? EyeOff : Eye} onPress={() => setShowPassword((value) => !value)} />
            <PrimaryButton label={loading ? 'Signing in...' : 'Sign in'} Icon={loading ? undefined : User} onPress={submit} disabled={loading} />
            {loading ? <ActivityIndicator color={Colors.infoBlue} /> : null}
          </Panel>

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
            <GhostButton label="Create account" tone="green" onPress={() => router.push('/auth/sign-up')} style={{ flex: 1 }} />
            <GhostButton label="Use offline" onPress={() => router.replace('/(tabs)')} style={{ flex: 1 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
