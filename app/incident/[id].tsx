import React, { useEffect, useState } from 'react';
import { Linking, RefreshControl, ScrollView, Share, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Clock, MapPin, Phone, Share2, Video, XCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataRow, GhostButton, Header, IconBadge, LoadingState, Panel, PrimaryButton, Screen, SectionTitle, StatusPill } from '../../components/AppKit';
import { Colors, ServiceTypeLabels, Spacing, Typography } from '../../constants/theme';
import { getIncident } from '../../lib/offline-cache';
import { Incident } from '../../types';

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function IncidentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!id) {
      setIncident(null);
      setLoading(false);
      return;
    }
    const result = await getIncident(id);
    setIncident(result);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [id]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function shareLocation() {
    if (!incident) return;
    const url = `https://maps.google.com/?q=${incident.location.lat},${incident.location.lng}`;
    await Share.share({ message: `RoadSoS emergency location: ${url}` });
  }

  if (loading) {
    return <Screen style={{ paddingTop: insets.top }}><LoadingState label="Loading incident..." /></Screen>;
  }

  if (!incident) {
    return (
      <Screen style={{ paddingTop: insets.top }}>
        <Header title="Incident" subtitle="Record not found" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
          <Panel style={{ alignItems: 'center', gap: Spacing.md }}>
            <Text style={{ color: Colors.textPrimary, ...Typography.h3 }}>Incident not found</Text>
            <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, textAlign: 'center' }}>
              This alert may have been cleared from local storage.
            </Text>
            <GhostButton label="Back to SOS" onPress={() => router.replace('/(tabs)')} />
          </Panel>
        </View>
      </Screen>
    );
  }

  const delivered = incident.smsStatuses.filter((status) => status.deviceSent || status.backupSent).length;
  const locationText = `${incident.location.lat.toFixed(5)}, ${incident.location.lng.toFixed(5)}`;

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Header
        title="SOS receipt"
        subtitle={formatTime(incident.createdAt)}
        showBack
        right={<StatusPill label={incident.triggerType === 'auto' ? 'Crash' : 'Manual'} tone={incident.triggerType === 'auto' ? 'amber' : 'red'} />}
      />
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.sosRed} />}
      >
        <Panel tone="red" style={{ alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl }}>
          <Text style={{ color: Colors.textMuted, ...Typography.label }}>INCIDENT ID</Text>
          <Text selectable style={{ color: Colors.textPrimary, fontSize: 34, lineHeight: 40, fontWeight: '900' }}>
            {incident.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>
            {delivered}/{incident.smsStatuses.length} contacts reached
          </Text>
        </Panel>

        <SectionTitle label="Location" />
        <Panel style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <IconBadge Icon={MapPin} tone="blue" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }} numberOfLines={2}>
                {incident.location.address || 'GPS coordinates'}
              </Text>
              <Text selectable style={{ color: Colors.textMuted, ...Typography.caption, marginTop: 2 }}>
                {locationText}
              </Text>
            </View>
          </View>
          <GhostButton label="Share location" Icon={Share2} tone="blue" onPress={shareLocation} />
        </Panel>

        <SectionTitle label="Delivery" />
        <View style={{ gap: Spacing.sm }}>
          {incident.smsStatuses.length === 0 ? (
            <Panel>
              <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>No emergency contacts were configured at the time of this SOS.</Text>
            </Panel>
          ) : (
            incident.smsStatuses.map((status) => (
              <Panel key={status.contactId} style={{ gap: Spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }} numberOfLines={1}>
                      {status.name}
                    </Text>
                    <Text style={{ color: Colors.textMuted, ...Typography.caption }} numberOfLines={1}>
                      {status.phone}
                    </Text>
                  </View>
                  <GhostButton label="Call" Icon={Phone} tone="green" onPress={() => Linking.openURL(`tel:${status.phone}`)} />
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <StatusPill label={status.deviceSent ? 'Device SMS sent' : 'Device SMS failed'} tone={status.deviceSent ? 'green' : 'neutral'} />
                  <StatusPill label={status.backupSent ? 'Backup sent' : 'Backup pending'} tone={status.backupSent ? 'blue' : 'neutral'} />
                </View>
                {status.error ? <Text style={{ color: Colors.warningAmber, ...Typography.caption }}>{status.error}</Text> : null}
              </Panel>
            ))
          )}
        </View>

        <SectionTitle label="Nearby services" />
        <Panel style={{ gap: 2 }}>
          {incident.services.length === 0 ? (
            <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>No nearby service snapshot was saved.</Text>
          ) : (
            incident.services.slice(0, 5).map((service) => (
              <View key={service.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }} numberOfLines={1}>
                    {service.name}
                  </Text>
                  <Text style={{ color: Colors.textMuted, ...Typography.caption }} numberOfLines={1}>
                    {ServiceTypeLabels[service.service_type]} - {service.distance_km.toFixed(1)} km
                  </Text>
                </View>
                <GhostButton label="Call" Icon={Phone} tone="green" onPress={() => Linking.openURL(`tel:${service.primary_phone}`)} />
              </View>
            ))
          )}
        </Panel>

        <SectionTitle label="Actions" />
        <Panel style={{ gap: Spacing.sm }}>
          <PrimaryButton label="Start live video" Icon={Video} onPress={() => router.push(`/stream/${incident.id}`)} />
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <GhostButton label="112" Icon={Phone} tone="red" onPress={() => Linking.openURL('tel:112')} style={{ flex: 1 }} />
            <GhostButton label="108" Icon={Phone} tone="amber" onPress={() => Linking.openURL('tel:108')} style={{ flex: 1 }} />
            <GhostButton label="100" Icon={Phone} tone="indigo" onPress={() => Linking.openURL('tel:100')} style={{ flex: 1 }} />
          </View>
        </Panel>

        <SectionTitle label="Audit" />
        <Panel style={{ gap: 2 }}>
          <DataRow label="Trigger" value={incident.triggerType === 'auto' ? 'Crash detection' : 'Manual SOS'} />
          <DataRow label="Created" value={formatTime(incident.createdAt)} />
          <DataRow label="Coordinates" value={locationText} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.sm }}>
            {delivered > 0 ? <CheckCircle size={18} color={Colors.safeGreen} /> : <XCircle size={18} color={Colors.warningAmber} />}
            <Clock size={18} color={Colors.textMuted} />
            <Text style={{ color: Colors.textMuted, ...Typography.caption, flex: 1 }}>
              Delivery depends on device SMS availability and optional backup configuration.
            </Text>
          </View>
        </Panel>
      </ScrollView>
    </Screen>
  );
}
