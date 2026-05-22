import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TriangleAlert } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { playAlarm, stopAlarm } from '../lib/alarm';
import * as Haptics from 'expo-haptics';

interface CountdownOverlayProps {
  visible: boolean;
  countdown: number;
  onCancel: () => void;
  onSendNow: () => void;
}

export const CountdownOverlay = React.memo(function CountdownOverlay({ visible, countdown, onCancel, onSendNow }: CountdownOverlayProps) {
  const alarmPlaying = useRef(false);
  const urgent = countdown <= 5;
  const tone = urgent ? Colors.sosRed : Colors.warningAmber;

  useEffect(() => {
    if (visible && !alarmPlaying.current) {
      playAlarm();
      alarmPlaying.current = true;
    }
    if (!visible && alarmPlaying.current) {
      stopAlarm();
      alarmPlaying.current = false;
    }
    return () => {
      stopAlarm();
      alarmPlaying.current = false;
    };
  }, [visible]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (!visible) return;
      if (state === 'active' && !alarmPlaying.current) {
        playAlarm();
        alarmPlaying.current = true;
      } else if (state !== 'active' && alarmPlaying.current) {
        stopAlarm();
        alarmPlaying.current = false;
      }
    });
    return () => sub.remove();
  }, [visible]);

  useEffect(() => {
    if (visible && urgent && countdown > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [countdown, urgent, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel} accessibilityViewIsModal>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', padding: Spacing.xl, justifyContent: 'center' }}>
        <View
          style={{
            borderRadius: Radius.xxl,
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: `${tone}66`,
            padding: Spacing.xl,
            alignItems: 'center',
            gap: Spacing.md,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: `${tone}16`,
              borderWidth: 1,
              borderColor: `${tone}44`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TriangleAlert size={34} color={tone} />
          </View>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ color: Colors.textPrimary, ...Typography.h1 }}>Crash detected</Text>
            <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, textAlign: 'center' }}>
              SOS will be sent automatically unless you cancel.
            </Text>
          </View>
          <View
            style={{
              width: 132,
              height: 132,
              borderRadius: 66,
              borderWidth: 3,
              borderColor: `${tone}55`,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${tone}10`,
            }}
          >
            <Text accessibilityLiveRegion="polite" style={{ color: tone, fontSize: 72, lineHeight: 82, fontWeight: '900' }}>
              {countdown}
            </Text>
          </View>
          <View style={{ width: '100%', gap: Spacing.sm, marginTop: Spacing.sm }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel SOS, I am okay"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onCancel();
              }}
              style={({ pressed }) => ({
                minHeight: 54,
                borderRadius: Radius.input,
                backgroundColor: Colors.safeGreen,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.82 : 1,
              })}
            >
              <Text style={{ color: '#FFFFFF', ...Typography.buttonLarge }}>I am okay</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send SOS now"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                onSendNow();
              }}
              style={({ pressed }) => ({
                minHeight: 54,
                borderRadius: Radius.input,
                backgroundColor: Colors.sosRed,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.82 : 1,
              })}
            >
              <Text style={{ color: '#FFFFFF', ...Typography.buttonLarge }}>Send SOS now</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
});
