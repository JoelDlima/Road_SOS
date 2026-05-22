import React, { useEffect, useRef } from 'react';
import { View, Text, AppState, AppStateStatus } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { AppStatus } from '../types';
import { Colors, Radius } from '../constants/theme';

interface StatusBadgeProps {
  status: AppStatus;
}

const STATUS: Record<AppStatus, { label: string; color: string; bg: string }> = {
  online:     { label: 'LIVE',       color: Colors.safeGreen, bg: Colors.safeGreen + '18' },
  offline:    { label: 'OFFLINE',    color: Colors.warningAmber, bg: Colors.warningAmber + '18' },
  'ai-offline': { label: 'AI OFFLINE', color: Colors.textMuted, bg: Colors.textMuted + '18' },
};

export const StatusBadge = React.memo(function StatusBadge({ status }: StatusBadgeProps) {
  const { label, color, bg } = STATUS[status];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(opacity);
    if (status === 'online') {
      scale.value = 1;
      opacity.value = 0.8;
      scale.value = withRepeat(
        withTiming(1.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1, true
      );
      opacity.value = withRepeat(
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1, true
      );
    } else {
      scale.value = 1;
      opacity.value = 0.8;
    }
  }, [status]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        cancelAnimation(scale);
        cancelAnimation(opacity);
        scale.value = 1;
        opacity.value = 0.8;
      } else if (appState.current.match(/inactive|background/) && nextState === 'active' && status === 'online') {
        scale.value = 1;
        opacity.value = 0.8;
        scale.value = withRepeat(
          withTiming(1.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          -1, true
        );
        opacity.value = withRepeat(
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          -1, true
        );
      }
      appState.current = nextState;
    });

    return () => sub.remove();
  }, [status]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Connection status: ${label}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: bg, borderWidth: 1, borderColor: color + '30' }}
    >
      <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
        {status === 'online' && (
          <Animated.View style={[ringStyle, { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: color }]} />
        )}
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 2 }} />
      </View>
      <Text style={{ color, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>{label}</Text>
    </View>
  );
});
