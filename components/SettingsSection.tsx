import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { Colors } from '../constants/theme';

export function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginTop: 28, paddingHorizontal: 20, textTransform: 'uppercase' }}>
      {title}
    </Text>
  );
}

export function SettingsCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' }, style]}>
      {children}
    </View>
  );
}
