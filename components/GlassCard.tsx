import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors, Radius } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderColor?: string | null;
  radius?: keyof typeof Radius;
  testID?: string;
}

export function GlassCard({ children, style, borderColor, radius = 'xxl', testID }: GlassCardProps) {
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: 'rgba(18,18,24,0.85)',
        borderRadius: Radius[radius],
        borderWidth: 1,
        borderColor: borderColor ?? Colors.border,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 4,
        ...style,
      }}
    >
      {children}
    </View>
  );
}
