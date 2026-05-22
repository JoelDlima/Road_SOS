import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Divider, GhostButton, Header, PrimaryButton, Screen, TextField } from '../../components/AppKit';
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
        <Header title="Sign in" subtitle="Sync incidents and profile" showBack />
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
              backgroundColor: `${Colors.sosRed}1F`,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: Spacing.xs,
              marginBottom: Spacing.md,
            }}
          >
            <ShieldCheck size={30} color={Colors.sosRed} strokeWidth={2.2} />
          </View>
          <Text style={{ color: Colors.textPrimary, ...Typography.h1 }}>Welcome back</Text>
          <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, marginTop: 4 }}>
            Sign in to sync incidents and contacts across devices. RoadSoS still works offline without an account.
          </Text>

          {/* Form */}
          <View style={{ gap: Spacing.sm, marginTop: Spacing.xl }}>
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
            label={loading ? 'Signing in…' : 'Sign in'}
            onPress={submit}
            disabled={loading}
            style={{ marginTop: Spacing.lg }}
          />
          {loading ? <ActivityIndicator color={Colors.sosRed} style={{ marginTop: Spacing.sm }} /> : null}

          {/* OR divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.xl }}>
            <Divider style={{ flex: 1 }} />
            <Text style={{ color: Colors.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>OR</Text>
            <Divider style={{ flex: 1 }} />
          </View>

          <GhostButton label="Continue without account" onPress={() => router.replace('/(tabs)')} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create an account"
            onPress={() => router.push('/auth/sign-up')}
            hitSlop={8}
            style={{ alignSelf: 'center', flexDirection: 'row', marginTop: Spacing.xl }}
          >
            <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>Don't have an account? </Text>
            <Text style={{ color: Colors.sosRed, ...Typography.bodySmall, fontWeight: '800' }}>Sign up</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
