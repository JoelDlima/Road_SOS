import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, MapPin, Navigation, Phone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { NearbyService } from '../types';
import { Colors, Radius, ServiceTypeLabels, Spacing, Typography } from '../constants/theme';
import { serviceVisual } from '../constants/serviceVisuals';
import { Divider, GhostButton, IconBadge } from './AppKit';

interface ServiceCardProps {
  service: NearbyService;
  expanded: boolean;
  onToggle: () => void;
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.max(1, Math.round(km * 1000))} m` : `${km.toFixed(1)} km`;
}

export const ServiceCard = React.memo(function ServiceCard({ service, expanded, onToggle }: ServiceCardProps) {
  const { Icon, tone } = serviceVisual(service.service_type);
  const label = ServiceTypeLabels[service.service_type] ?? service.service_type;
  const Chevron = expanded ? ChevronUp : ChevronDown;

  function call() {
    if (!service.primary_phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${service.primary_phone}`);
  }

  function directions() {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lng}`);
  }

  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: Radius.card,
        borderWidth: 1,
        borderColor: expanded ? Colors.borderStrong : Colors.border,
        overflow: 'hidden',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={service.name}
        accessibilityHint={expanded ? 'Collapse details' : 'Expand for phone and directions'}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          padding: Spacing.sm,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <IconBadge Icon={Icon} tone={tone} size={38} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: 14.5, lineHeight: 19, fontWeight: '700' }} numberOfLines={1}>
            {service.name}
          </Text>
          <Text style={{ color: Colors.textMuted, ...Typography.caption, marginTop: 1 }} numberOfLines={1}>
            {label} · {formatDistance(service.distance_km)}
            {service.is_24x7 ? ' · 24/7' : ''}
          </Text>
        </View>
        <Chevron size={18} color={Colors.textMuted} />
      </Pressable>

      {expanded ? (
        <>
          <Divider />
          <View style={{ padding: Spacing.sm, gap: Spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Phone size={15} color={Colors.textFaint} />
              <Text style={{ color: Colors.textPrimary, fontSize: 13, lineHeight: 18 }}>
                {service.primary_phone || 'No phone listed'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <MapPin size={15} color={Colors.textFaint} style={{ marginTop: 1 }} />
              <Text style={{ color: Colors.textMuted, fontSize: 13, lineHeight: 18, flex: 1 }}>
                {service.address || 'Address unavailable'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xxs }}>
              <GhostButton label="Call" Icon={Phone} tone="green" onPress={call} style={{ flex: 1 }} />
              <GhostButton label="Directions" Icon={Navigation} tone="blue" onPress={directions} style={{ flex: 1 }} />
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
});
