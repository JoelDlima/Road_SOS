import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Activity, ArrowLeft, ArrowRight, Check, MapPin, MessageSquare, Phone, Shield, ShieldCheck, Trash2 } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { ensureSendSmsPermission } from '../lib/direct-sms';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, GhostButton, IconBadge, Panel, PrimaryButton, Screen, SectionTitle, StatusPill, TextField } from '../components/AppKit';
import { Colors, Spacing, Typography } from '../constants/theme';
import { saveEmergencyContacts, saveUserProfile } from '../lib/offline-cache';
import { uid } from '../lib/utils';
import { validateName, validatePhone } from '../lib/validators';
import { BloodGroup, EmergencyContact, Language, UserProfile } from '../types';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const LANGUAGES: Language[] = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi'];

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <View
      style={{
        width: active ? 24 : 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: done || active ? Colors.sosRed : Colors.surface3,
      }}
    />
  );
}

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [language, setLanguage] = useState<Language>('English');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [conditions, setConditions] = useState('');
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactError, setContactError] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);
  const [smsGranted, setSmsGranted] = useState(false);
  const [crashDetectionEnabled, setCrashDetectionEnabled] = useState(true);

  function go(next: number) {
    Haptics.selectionAsync();
    setStep(Math.max(0, Math.min(2, next)));
  }

  function addContact() {
    const nameResult = validateName(contactName);
    if (!nameResult.valid) {
      Alert.alert('Name required', nameResult.error ?? 'Add a contact name.');
      return;
    }
    const phoneResult = validatePhone(contactPhone);
    if (!phoneResult.valid) {
      setContactError(phoneResult.error ?? 'Invalid phone number');
      return;
    }
    if (contacts.length >= 3) {
      Alert.alert('Contact limit', 'RoadSoS supports up to 3 emergency contacts.');
      return;
    }
    setContacts((current) => [...current, { id: uid(), name: contactName.trim(), phone: contactPhone.trim() }]);
    setContactName('');
    setContactPhone('');
    setContactError('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function requestLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationGranted(status === 'granted');
    if (status !== 'granted') {
      Alert.alert('Location not enabled', 'You can still finish setup, but SOS alerts work best with location access.');
    }
  }

  async function requestSms() {
    const result = await ensureSendSmsPermission();
    if (result === 'granted') {
      setSmsGranted(true);
    } else if (result === 'blocked') {
      Alert.alert(
        'SMS blocked by Android',
        'Android restricts SMS for sideloaded apps. Your SOS will still send — the SMS app will open pre-filled so you can tap Send.',
        [{ text: 'OK' }],
      );
    } else {
      Alert.alert('SMS not enabled', 'You can still finish setup. When SOS fires, the SMS app will open pre-filled for you to confirm.');
    }
  }

  async function finish(allowIncomplete = false) {
    const profileName = name.trim();
    if (!profileName && !allowIncomplete) {
      setStep(0);
      Alert.alert('Name required', 'Add your name so emergency contacts know who needs help.');
      return;
    }
    if (contacts.length === 0 && !allowIncomplete) {
      setStep(1);
      Alert.alert('Add one contact', 'Add at least one emergency contact before finishing setup.');
      return;
    }

    const profile: UserProfile = {
      name: profileName || 'RoadSoS User',
      bloodGroup,
      language,
      medicalInfo: { allergies, medications, conditions },
      crashDetectionEnabled,
      crashSensitivity: 'medium',
      appMode: 'normal',
      devMode: false,
      onboardingComplete: true,
      batteryOptimization: false,
    };

    await saveUserProfile(profile);
    await saveEmergencyContacts(contacts);
    router.replace('/model-setup');
  }

  function skipSetup() {
    Alert.alert('Skip setup?', 'You can finish with placeholder profile data and add contacts later in Profile.', [
      { text: 'Continue setup', style: 'cancel' },
      { text: 'Skip', style: 'destructive', onPress: () => finish(true) },
    ]);
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: Colors.textPrimary, ...Typography.h1 }}>Set up RoadSoS</Text>
              <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, marginTop: 3 }}>Three quick steps for safer SOS alerts.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Skip setup" onPress={skipSetup} hitSlop={10}>
              <Text style={{ color: Colors.textMuted, ...Typography.button }}>Skip</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 7, marginTop: Spacing.lg }}>
            {[0, 1, 2].map((item) => <StepDot key={item} active={step === item} done={step > item} />)}
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 ? (
            <View>
              {/* ─── Welcome hero ─── matches design: centered shield-check, title, sub */}
              <Panel tone="red" style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: `${Colors.sosRed}1F`,
                    borderWidth: 1,
                    borderColor: `${Colors.sosRed}38`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={36} color={Colors.sosRed} strokeWidth={2.2} />
                </View>
                <Text style={{ color: Colors.textPrimary, ...Typography.h2, textAlign: 'center' }}>Welcome to RoadSoS</Text>
                <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, textAlign: 'center' }}>
                  Your personal emergency co-pilot
                </Text>
              </Panel>

              {/* ─── About you ─── */}
              <SectionTitle label="About you" />
              <TextField
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoComplete="name"
              />

              {/* Blood group — horizontal scroll chips */}
              <View style={{ marginTop: Spacing.md, gap: Spacing.xs }}>
                <Text style={{ color: Colors.textPrimary, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
                  Blood group
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: Spacing.xs, paddingRight: Spacing.lg }}
                  style={{ marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg }}
                >
                  {BLOOD_GROUPS.map((group) => (
                    <Chip
                      key={group}
                      label={group}
                      selected={bloodGroup === group}
                      onPress={() => setBloodGroup(group)}
                      tone="red"
                    />
                  ))}
                </ScrollView>
              </View>

              {/* Language — horizontal scroll chips */}
              <View style={{ marginTop: Spacing.md, gap: Spacing.xs }}>
                <Text style={{ color: Colors.textPrimary, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
                  Language
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: Spacing.xs, paddingRight: Spacing.lg }}
                  style={{ marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg }}
                >
                  {LANGUAGES.map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      selected={language === item}
                      onPress={() => setLanguage(item)}
                      tone="blue"
                    />
                  ))}
                </ScrollView>
              </View>

              {/* ─── Medical info · optional ─── */}
              <SectionTitle label="Medical info · optional" />
              <Panel style={{ gap: Spacing.sm }}>
                <TextField
                  label="Allergies"
                  value={allergies}
                  onChangeText={setAllergies}
                  placeholder="e.g. Penicillin"
                />
                <TextField
                  label="Medications"
                  value={medications}
                  onChangeText={setMedications}
                  placeholder="Daily medicines"
                />
                <TextField
                  label="Conditions"
                  value={conditions}
                  onChangeText={setConditions}
                  placeholder="e.g. Asthma"
                />
              </Panel>
            </View>
          ) : null}

          {step === 1 ? (
            <View>
              <Panel tone="amber" style={{ gap: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <IconBadge Icon={Phone} tone="amber" size={52} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.textPrimary, ...Typography.h3 }}>Emergency contacts</Text>
                    <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, marginTop: 2 }}>
                      SOS messages are sent to these contacts with your location.
                    </Text>
                  </View>
                  <StatusPill label={`${contacts.length}/3`} tone="amber" />
                </View>
                <TextField label="Contact name" value={contactName} onChangeText={setContactName} placeholder="Family member or friend" />
                <TextField
                  label="Phone"
                  value={contactPhone}
                  onChangeText={(value) => {
                    setContactPhone(value);
                    setContactError('');
                  }}
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  error={contactError}
                  onSubmitEditing={addContact}
                />
                <GhostButton label="Add contact" tone="green" Icon={Phone} onPress={addContact} />
              </Panel>

              <SectionTitle label="Saved contacts" />
              <View style={{ gap: Spacing.sm }}>
                {contacts.length === 0 ? (
                  <Panel>
                    <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>No contacts yet. Add at least one for the best emergency flow.</Text>
                  </Panel>
                ) : (
                  contacts.map((contact) => (
                    <Panel key={contact.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }} numberOfLines={1}>
                          {contact.name}
                        </Text>
                        <Text style={{ color: Colors.textMuted, ...Typography.caption }} numberOfLines={1}>
                          {contact.phone}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${contact.name}`}
                        onPress={() => setContacts((current) => current.filter((item) => item.id !== contact.id))}
                        style={({ pressed }) => ({
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: pressed ? `${Colors.sosRed}18` : Colors.surface2,
                        })}
                      >
                        <Trash2 size={18} color={Colors.textFaint} />
                      </Pressable>
                    </Panel>
                  ))
                )}
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View>
              <Panel tone="green" style={{ gap: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <IconBadge Icon={Shield} tone="green" size={52} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.textPrimary, ...Typography.h3 }}>Safety permissions</Text>
                    <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, marginTop: 2 }}>
                      Location and motion sensors power automatic emergency response.
                    </Text>
                  </View>
                </View>
              </Panel>

              <SectionTitle label="Core permissions" />
              <View style={{ gap: Spacing.sm }}>
                <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <IconBadge Icon={MapPin} tone="blue" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }}>Location sharing</Text>
                    <Text style={{ color: Colors.textMuted, ...Typography.caption }}>Attach GPS coordinates to SOS alerts.</Text>
                  </View>
                  {locationGranted ? (
                    <StatusPill label="Granted" tone="green" />
                  ) : (
                    <GhostButton label="Enable" tone="blue" onPress={requestLocation} />
                  )}
                </Panel>

                <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <IconBadge Icon={MessageSquare} tone="red" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }}>Send SMS</Text>
                    <Text style={{ color: Colors.textMuted, ...Typography.caption }}>Auto-send SOS texts to emergency contacts.</Text>
                  </View>
                  {smsGranted ? (
                    <StatusPill label="Granted" tone="green" />
                  ) : (
                    <GhostButton label="Enable" tone="red" onPress={requestSms} />
                  )}
                </Panel>

                <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <IconBadge Icon={Activity} tone="amber" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }}>Crash detection</Text>
                    <Text style={{ color: Colors.textMuted, ...Typography.caption }}>Monitor impact spikes and start an SOS countdown.</Text>
                  </View>
                  {crashDetectionEnabled ? (
                    <StatusPill label="Active" tone="green" />
                  ) : (
                    <GhostButton
                      label="Enable"
                      tone="amber"
                      Icon={Activity}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCrashDetectionEnabled(true);
                      }}
                    />
                  )}
                </Panel>
              </View>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl }}>
            {step > 0 ? (
              <GhostButton label="Back" Icon={ArrowLeft} onPress={() => go(step - 1)} style={{ flex: 0.8 }} />
            ) : null}
            {step < 2 ? (
              <PrimaryButton label="Continue" Icon={ArrowRight} onPress={() => go(step + 1)} style={{ flex: 1 }} />
            ) : (
              <PrimaryButton label="Finish setup" tone="green" Icon={Check} onPress={() => finish(false)} style={{ flex: 1 }} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
