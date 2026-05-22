import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertTriangle, Bell } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, runOnJS, withDelay } from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '../constants/theme';

const TAB_HEIGHT = 68;
const TAB_BOTTOM_OFFSET = 12;

export type SnackbarVariant = 'success' | 'error' | 'info';

interface SnackbarProps {
  visible: boolean;
  message: string;
  variant?: SnackbarVariant;
  /** Called once the snackbar has finished its hide animation. */
  onHide?: () => void;
  /** Auto-hide duration in ms. Set to 0 to keep visible until visible=false. Default 2200. */
  duration?: number;
  /** Lift snackbar above the floating tab bar. Default true. */
  aboveTabBar?: boolean;
}

const VARIANTS: Record<SnackbarVariant, { color: string; bg: string; border: string; Icon: typeof CheckCircle }> = {
  success: { color: Colors.safeGreen, bg: 'rgba(48,209,88,0.15)', border: 'rgba(48,209,88,0.4)', Icon: CheckCircle },
  error: { color: Colors.sosRed, bg: 'rgba(255,59,48,0.15)', border: 'rgba(255,59,48,0.4)', Icon: AlertTriangle },
  info: { color: Colors.infoBlue, bg: 'rgba(10,132,255,0.15)', border: 'rgba(10,132,255,0.4)', Icon: Bell },
};

/**
 * Pinned snackbar that animates in from the bottom and auto-dismisses.
 * Stays clear of the floating tab bar by default.
 *
 * Usage:
 *   const [saved, setSaved] = useState(false);
 *   <Snackbar visible={saved} message="Saved" onHide={() => setSaved(false)} />
 */
export const Snackbar = React.memo(function Snackbar({
  visible,
  message,
  variant = 'success',
  onHide,
  duration = 2200,
  aboveTabBar = true,
}: SnackbarProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 220 });
      if (duration > 0 && onHide) {
        const cb = () => { if (onHide) onHide(); };
        opacity.value = withSequence(
          withTiming(1, { duration: 200 }),
          withDelay(duration, withTiming(0, { duration: 220 }, (finished) => {
            if (finished) runOnJS(cb)();
          })),
        );
        translateY.value = withSequence(
          withTiming(0, { duration: 220 }),
          withDelay(duration, withTiming(40, { duration: 220 })),
        );
      }
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(40, { duration: 180 });
    }
  }, [visible, duration, onHide]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const v = VARIANTS[variant];
  const Icon = v.Icon;

  const bottomOffset = aboveTabBar
    ? insets.bottom + TAB_BOTTOM_OFFSET + TAB_HEIGHT + Spacing.sm
    : insets.bottom + Spacing.md;

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { bottom: bottomOffset }, animStyle]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={[styles.pill, { backgroundColor: v.bg, borderColor: v.border }]}>
        <Icon size={16} color={v.color} />
        <Text style={[styles.text, { color: v.color }]} numberOfLines={2}>{message}</Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: '90%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
});
