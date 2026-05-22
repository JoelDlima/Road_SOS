import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Wifi, WifiOff, Cpu, Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, Radius, Animation, Spacing } from '../constants/theme';
import * as Haptics from 'expo-haptics';

type InferenceMode = 'local' | 'groq' | 'offline';

interface ModePickerProps {
  visible: boolean;
  mode: InferenceMode;
  modelReady: boolean;
  isOnline: boolean;
  onSelectMode: (mode: InferenceMode) => void;
  onClose: () => void;
}

export default function ModePicker({ visible, mode, modelReady, isOnline, onSelectMode, onClose }: ModePickerProps) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, Animation.spring);
      opacity.value = withSpring(1);
    } else {
      scale.value = 0.9;
      opacity.value = 0;
    }
  }, [visible]);

  const options = [
    { key: 'local' as const, label: 'Local AI', desc: modelReady ? 'On-device, private, no internet' : 'Model not downloaded', icon: Cpu, color: Colors.indigoAccent, disabled: !modelReady },
    { key: 'groq' as const, label: 'Groq Cloud', desc: isOnline ? 'LLaMA 3.3 70B via API' : 'No internet connection', icon: Wifi, color: Colors.safeGreen, disabled: !isOnline },
    { key: 'offline' as const, label: 'Offline Mode', desc: 'Hardcoded first-aid text only', icon: WifiOff, color: Colors.textMuted, disabled: false },
  ] as const;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        <Animated.View style={[containerStyle, { width: '85%', maxWidth: 400 }]}>
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: Radius.xl,
              padding: Spacing.xs,
              borderWidth: 1,
              borderColor: Colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
              elevation: 16,
            }}
          >
            <Text style={{ color: Colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.xs }}>
              AI MODE
            </Text>
            {options.map((opt) => {
              const active = mode === opt.key;
              const Icon = opt.icon;
              return (
                <Pressable
                  key={opt.key}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.md,
                    padding: Spacing.md,
                    marginVertical: 2,
                    borderRadius: Radius.lg,
                    backgroundColor: opt.disabled
                      ? 'transparent'
                      : active ? opt.color + '18' : 'transparent',
                    borderWidth: 1,
                    borderColor: opt.disabled
                      ? 'transparent'
                      : active ? opt.color + '40' : 'transparent',
                    opacity: opt.disabled ? 0.45 : pressed ? 0.8 : 1,
                    minHeight: 56,
                  })}
                  onPress={() => { if (!opt.disabled) { Haptics.selectionAsync(); onSelectMode(opt.key); } }}
                  accessibilityLabel={opt.label}
                  accessibilityHint={opt.disabled ? 'Currently unavailable' : opt.desc}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: opt.disabled }}
                  disabled={opt.disabled}
                >
                  <Icon size={18} color={opt.disabled ? Colors.textFaint : (active ? opt.color : Colors.textMuted)} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: opt.disabled ? Colors.textFaint : (active ? Colors.textPrimary : Colors.textMuted), fontWeight: active ? '700' : '500', fontSize: 14 }}>
                      {opt.label}
                    </Text>
                    <Text style={{ color: Colors.textFaint, fontSize: 11, marginTop: 1 }}>{opt.desc}</Text>
                  </View>
                  {active && !opt.disabled && <Check size={18} color={opt.color} />}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
