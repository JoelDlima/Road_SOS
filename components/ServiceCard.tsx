import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Clock, MapPin, Phone } from 'lucide-react-native';
import { NearbyService } from '../types';
import { Colors, Radius, ServiceTypeColors, ServiceTypeLabels, Spacing, Typography } from '../constants/theme';
import * as Haptics from 'expo-haptics';

interface ServiceCardProps {
  service: NearbyService;
  index?: number;
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.max(1, Math.round(km * 1000))} m` : `${km.toFixed(1)} km`;
}

export const ServiceCard = React.memo(function ServiceCard({ service }: ServiceCardProps) {
  const color = ServiceTypeColors[service.service_type] ?? Colors.infoBlue;
  const label = ServiceTypeLabels[service.service_type] ?? service.service_type;

  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: Radius.card,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
        gap: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: `${color}18`,
            borderWidth: 1,
            borderColor: `${color}35`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MapPin size={18} color={color} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }} numberOfLines={2}>
            {service.name}
          </Text>
          <Text style={{ color: Colors.textMuted, ...Typography.caption, marginTop: 2 }} numberOfLines={2}>
            {service.address || 'Address unavailable'}
          </Text>
        </View>
        <Text style={{ color, fontSize: 13, lineHeight: 18, fontWeight: '900' }} numberOfLines={1}>
          {formatDistance(service.distance_km)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' }}>
        <View style={{ borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: `${color}16`, borderWidth: 1, borderColor: `${color}32` }}>
          <Text style={{ color, fontSize: 11, lineHeight: 14, fontWeight: '800' }}>{label}</Text>
        </View>
        {service.is_24x7 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: `${Colors.safeGreen}16` }}>
            <Clock size={12} color={Colors.safeGreen} />
            <Text style={{ color: Colors.safeGreen, fontSize: 11, lineHeight: 14, fontWeight: '800' }}>24/7</Text>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm }}>
        <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, flex: 1 }} numberOfLines={1}>
          {service.primary_phone || 'No phone listed'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Call ${service.name}`}
          disabled={!service.primary_phone}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Linking.openURL(`tel:${service.primary_phone}`);
          }}
          style={({ pressed }) => ({
            minHeight: 42,
            borderRadius: Radius.input,
            backgroundColor: service.primary_phone ? Colors.safeGreen : Colors.surface3,
            paddingHorizontal: Spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            opacity: pressed ? 0.78 : 1,
          })}
        >
          <Phone size={16} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', ...Typography.button }}>Call</Text>
        </Pressable>
      </View>
    </View>
  );
});
