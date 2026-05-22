import React, { useEffect } from 'react';
import { Pressable, Text, View, Dimensions, Platform, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

interface SOSButtonProps {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: { disabled: boolean };
}

const { width: screenWidth } = Dimensions.get('window');
// Visible red disc.
const BUTTON_SIZE = Math.round(Math.min(screenWidth * 0.5, 220));
// The container needs enough headroom around the disc for the pulse rings.
// Anything bigger than the largest ring scale leaves clean breathing room.
const PULSE_GUTTER = Math.round(BUTTON_SIZE * 0.55);
const CONTAINER_SIZE = BUTTON_SIZE + PULSE_GUTTER * 2;

export const SOSButton = React.memo(function SOSButton({
  onPress,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: SOSButtonProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.45);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.6, { duration: 1800, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1800, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
    };
  }, []);

  // The pulse ring is the same size as the disc, centered on it via the
  // percentage + negative-margin trick, then transform-scaled outward.
  // Scale uses the element's own center as origin, so growth stays symmetric.
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const fontSize = Math.round(BUTTON_SIZE * 0.22);
  const subFontSize = Math.round(BUTTON_SIZE * 0.075);

  return (
    <View style={styles.container}>
      <Animated.View pointerEvents="none" style={[styles.pulse, pulseStyle]} accessibilityElementsHidden />

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? 'SOS Emergency Alert'}
        accessibilityHint={accessibilityHint ?? 'Asks for confirmation, then sends SOS to all your saved contacts'}
        accessibilityState={accessibilityState}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed ? '#C72A2D' : Colors.sosRed,
            opacity: disabled ? 0.45 : pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
      >
        <View style={styles.innerRing} pointerEvents="none" />
        <Text style={[styles.label, { fontSize }]} allowFontScaling={false}>SOS</Text>
        <Text
          style={[styles.sublabel, { fontSize: subFontSize, marginTop: Math.round(BUTTON_SIZE * 0.03) }]}
          allowFontScaling={false}
        >
          PRESS TO ALERT
        </Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    // Percentage + negative-margin centering: top/left at 50% of the parent,
    // then nudged back by half the element so the geometric center sits dead
    // on the parent's center. Cannot drift no matter what other layout does.
    top: '50%',
    left: '50%',
    marginTop: -BUTTON_SIZE / 2,
    marginLeft: -BUTTON_SIZE / 2,
    backgroundColor: Colors.sosRed,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,170,170,0.55)',
    shadowColor: Colors.sosRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: Platform.OS === 'android' ? 16 : 0,
  },
  innerRing: {
    position: 'absolute',
    width: BUTTON_SIZE - 18,
    height: BUTTON_SIZE - 18,
    borderRadius: (BUTTON_SIZE - 18) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  label: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 4,
  },
  sublabel: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    letterSpacing: 2.2,
  },
});
