import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Eye, EyeOff, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GhostButton, Header, IconBadge, Panel, PrimaryButton, Screen, TextField } from '../../components/AppKit';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { signUp, syncToCloud } from '../../lib/auth';
import { getUserProfile } from '../../lib/offline-cache';
import { validateEmail, validateName } from '../../lib/validators';

function Strength({ password }: { password: string }) {
  const checks = useMemo(
    () => [
      { label: '6 or more characters', ok: password.length >= 6 },
      { label: 'Contains a number', ok: /[0-9]/.test(password) },
      { label: 'Contains uppercase', ok: /[A-Z]/.test(password) },
    ],
    [password],
  );

  if (!password) return null;

  return (
    <View style={{ gap: 5 }}>
      {checks.map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Check size={13} color={item.ok ? Colors.safeGreen : Colors.textFaint} />
          <Text style={{ color: item.ok ? Colors.safeGreen : Colors.textFaint, ...Typography.caption }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const nameResult = validateName(name);
    if (!nameResult.valid) {
      Alert.alert('Name required', nameResult.error ?? 'Enter your name.');
      return;
    }
    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      Alert.alert('Invalid email', emailResult.error ?? 'Enter a valid email.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Re-enter the same password.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      const profile = await getUserProfile();
      if (profile) await syncToCloud();
      Alert.alert('Account created', 'Check your email for a confirmation link.', [
        { text: 'Continue', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error) {
      Alert.alert('Sign up failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Header title="Create account" subtitle="Optional cloud sync" showBack />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Panel tone="green" style={{ gap: Spacing.md }}>
            <IconBadge Icon={User} tone="green" size={58} />
            <View>
              <Text style={{ color: Colors.textPrimary, ...Typography.h1 }}>Keep data in sync</Text>
              <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, marginTop: 4 }}>
                Create an account only if you want cloud backup for your profile and contacts.
              </Text>
            </View>
            <TextField label="Name" value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" />
            <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Strength password={password} />
            <TextField
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              error={confirm && confirm !== password ? 'Passwords do not match' : undefined}
              onSubmitEditing={submit}
            />
            <GhostButton label={showPassword ? 'Hide password' : 'Show password'} Icon={showPassword ? EyeOff : Eye} onPress={() => setShowPassword((value) => !value)} />
            <PrimaryButton label={loading ? 'Creating...' : 'Create account'} tone="green" Icon={loading ? undefined : User} onPress={submit} disabled={loading} />
            {loading ? <ActivityIndicator color={Colors.safeGreen} /> : null}
          </Panel>

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
            <GhostButton label="Sign in" tone="blue" onPress={() => router.push('/auth/sign-in')} style={{ flex: 1 }} />
            <GhostButton label="Use offline" onPress={() => router.replace('/(tabs)')} style={{ flex: 1 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
