import React, { useCallback } from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors, Radius } from '../constants/theme';
import * as Haptics from 'expo-haptics';

interface GlassPressableProps {
  onPress: () => void;
  disabled?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'text';
  borderColor?: string;
  backgroundColor?: string;
  pressedBackgroundColor?: string;
  glass?: boolean;
  hitSlop?: number;
  testID?: string;
}

export function GlassPressable({
  onPress,
  disabled,
  haptic = true,
  style,
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  borderColor,
  backgroundColor,
  pressedBackgroundColor,
  glass = true,
  hitSlop,
  testID,
}: GlassPressableProps) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: bgOpacity.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.96, { duration: 80, easing: Easing.inOut(Easing.ease) });
    bgOpacity.value = withTiming(0.85, { duration: 80 });
    if (haptic) Haptics.selectionAsync();
  }, [haptic]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.ease) });
    bgOpacity.value = withTiming(1, { duration: 120 });
  }, []);

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
        hitSlop={hitSlop}
        style={({ pressed }) => ({
          backgroundColor: glass
            ? pressed
              ? (pressedBackgroundColor ?? 'rgba(255,255,255,0.08)')
              : (backgroundColor ?? 'rgba(18,18,24,0.85)')
            : backgroundColor ?? Colors.surface,
          borderRadius: Radius.card,
          borderWidth: 1,
          borderColor: borderColor ?? (glass ? 'rgba(255,255,255,0.06)' : Colors.border),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
          ...style,
        })}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
