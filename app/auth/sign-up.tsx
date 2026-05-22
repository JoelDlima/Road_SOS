import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Divider, GhostButton, Header, PrimaryButton, Screen, TextField } from '../../components/AppKit';
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
        <Header title="Create account" subtitle="Sync incidents and profile" showBack />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: `${Colors.safeGreen}1F`,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: Spacing.xs,
              marginBottom: Spacing.md,
            }}
          >
            <ShieldCheck size={30} color={Colors.safeGreen} strokeWidth={2.2} />
          </View>
          <Text style={{ color: Colors.textPrimary, ...Typography.h1 }}>Keep data in sync</Text>
          <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, marginTop: 4 }}>
            Create an account only if you want cloud backup for your profile and contacts.
          </Text>

          {/* Form */}
          <View style={{ gap: Spacing.sm, marginTop: Spacing.xl }}>
            <TextField label="Name" value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword((value) => !value)}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' }}
            >
              {showPassword ? <EyeOff size={14} color={Colors.textMuted} /> : <Eye size={14} color={Colors.textMuted} />}
              <Text style={{ color: Colors.textMuted, ...Typography.caption }}>{showPassword ? 'Hide password' : 'Show password'}</Text>
            </Pressable>
          </View>

          <PrimaryButton
            label={loading ? 'Creating…' : 'Create account'}
            tone="green"
            onPress={submit}
            disabled={loading}
            style={{ marginTop: Spacing.lg }}
          />
          {loading ? <ActivityIndicator color={Colors.safeGreen} style={{ marginTop: Spacing.sm }} /> : null}

          {/* OR divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.xl }}>
            <Divider style={{ flex: 1 }} />
            <Text style={{ color: Colors.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>OR</Text>
            <Divider style={{ flex: 1 }} />
          </View>

          <GhostButton label="Continue without account" onPress={() => router.replace('/(tabs)')} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign in instead"
            onPress={() => router.push('/auth/sign-in')}
            hitSlop={8}
            style={{ alignSelf: 'center', flexDirection: 'row', marginTop: Spacing.xl }}
          >
            <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>Already have an account? </Text>
            <Text style={{ color: Colors.sosRed, ...Typography.bodySmall, fontWeight: '800' }}>Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
