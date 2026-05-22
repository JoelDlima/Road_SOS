import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Colors, Radius } from '../constants/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: keyof typeof Radius;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%' as const, height = 16, radius = 'sm', style }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: Radius[radius],
          backgroundColor: Colors.surface2,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ lines = 3, style }: SkeletonCardProps) {
  return (
    <View style={{ gap: 12, ...style }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Skeleton width={44} height={44} radius="md" />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="70%" height={16} radius="sm" />
          <Skeleton width="50%" height={12} radius="sm" />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={`${100 - i * 15}%` as const} height={14} radius="sm" />
      ))}
    </View>
  );
}
