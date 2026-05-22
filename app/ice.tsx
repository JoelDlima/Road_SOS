import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, HeartPulse, Phone, Stethoscope, User } from 'lucide-react-native';
import { DataRow, GhostButton, Header, IconBadge, LoadingState, Panel, PrimaryButton, Screen, SectionTitle } from '../components/AppKit';
import { Colors, Spacing, Typography } from '../constants/theme';
import { getEmergencyContacts, getUserProfile } from '../lib/offline-cache';
import { EmergencyContact, UserProfile } from '../types';

export default function ICEScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getUserProfile(), getEmergencyContacts()])
      .then(([user, savedContacts]) => {
        setProfile(user);
        setContacts(savedContacts);
      })
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return <Screen style={{ paddingTop: insets.top }}><LoadingState label="Loading emergency card..." /></Screen>;
  }

  const medicalInfo = profile?.medicalInfo;
  const hasMedical = !!(medicalInfo?.allergies || medicalInfo?.medications || medicalInfo?.conditions);

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Header title="I.C.E. Card" subtitle="In case of emergency" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl }} showsVerticalScrollIndicator={false}>
        <Panel tone="red" style={{ gap: Spacing.md, alignItems: 'center', paddingVertical: Spacing.xl }}>
          <IconBadge Icon={HeartPulse} tone="red" size={74} />
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ color: Colors.textPrimary, ...Typography.display, textAlign: 'center' }} numberOfLines={2}>
              {profile?.name ?? 'Unknown person'}
            </Text>
            <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>Emergency medical profile</Text>
          </View>
          <View style={{ borderRadius: 14, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: `${Colors.sosRed}18`, borderWidth: 1, borderColor: `${Colors.sosRed}40` }}>
            <Text style={{ color: Colors.sosRed, fontSize: 24, lineHeight: 30, fontWeight: '900' }}>{profile?.bloodGroup ?? 'N/A'}</Text>
          </View>
        </Panel>

        <Panel tone="amber" style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
          <IconBadge Icon={AlertTriangle} tone="amber" />
          <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, flex: 1 }}>
            This screen is designed for first responders. It may be visible to anyone holding the phone.
          </Text>
        </Panel>

        <SectionTitle label="Medical notes" />
        <Panel style={{ gap: 2 }}>
          {hasMedical ? (
            <>
              <DataRow label="Allergies" value={medicalInfo?.allergies || 'Not listed'} />
              <DataRow label="Medications" value={medicalInfo?.medications || 'Not listed'} />
              <DataRow label="Conditions" value={medicalInfo?.conditions || 'Not listed'} />
            </>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <IconBadge Icon={Stethoscope} tone="neutral" />
              <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, flex: 1 }}>No medical notes were added.</Text>
            </View>
          )}
        </Panel>

        <SectionTitle label="Emergency contacts" />
        <View style={{ gap: Spacing.sm }}>
          {contacts.length === 0 ? (
            <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <IconBadge Icon={User} tone="neutral" />
              <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, flex: 1 }}>No emergency contacts saved.</Text>
            </Panel>
          ) : (
            contacts.map((contact) => (
              <Panel key={contact.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }} numberOfLines={1}>
                    {contact.name}
                  </Text>
                  <Text style={{ color: Colors.textMuted, ...Typography.caption }} numberOfLines={1}>
                    {contact.phone}
                  </Text>
                </View>
                <GhostButton label="Call" Icon={Phone} tone="green" onPress={() => Linking.openURL(`tel:${contact.phone}`)} />
              </Panel>
            ))
          )}
        </View>

        <PrimaryButton
          label="Call 112 emergency"
          Icon={Phone}
          style={{ marginTop: Spacing.xl }}
          onPress={() => {
            Alert.alert('Call 112?', 'Dial national emergency services now?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Call', style: 'destructive', onPress: () => Linking.openURL('tel:112') },
            ]);
          }}
        />
      </ScrollView>
    </Screen>
  );
}
