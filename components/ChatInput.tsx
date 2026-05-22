import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Send, Square } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import * as Haptics from 'expo-haptics';

interface ChatInputProps {
  input: string;
  setInput: (text: string) => void;
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop?: () => void;
}

export default function ChatInput({ input, setInput, isStreaming, onSend, onStop }: ChatInputProps) {
  const trimmed = input.trim();
  const canStop = isStreaming && !!onStop;
  const disabled = !canStop && (isStreaming || trimmed.length === 0);
  const remaining = 500 - input.length;

  function handleSend() {
    if (disabled) return;
    onSend(trimmed);
    setInput('');
  }

  return (
    <View
      style={{
        marginHorizontal: Spacing.lg,
        borderRadius: Radius.xl,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderStrong,
        padding: Spacing.xs,
      }}
    >
      {isStreaming ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: Spacing.sm, paddingBottom: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.infoBlue }} />
          <Text style={{ color: Colors.infoBlue, ...Typography.caption }}>Assistant is responding</Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Describe the emergency..."
          placeholderTextColor={Colors.textFaint}
          selectionColor={Colors.sosRed}
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={handleSend}
          accessibilityLabel="Emergency message input"
          style={{
            flex: 1,
            minHeight: 42,
            maxHeight: 116,
            color: Colors.textPrimary,
            fontSize: 16,
            lineHeight: 22,
            paddingHorizontal: Spacing.sm,
            paddingTop: 10,
            paddingBottom: 10,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={canStop ? 'Stop response' : 'Send message'}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => {
            if (canStop) {
              onStop!();
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleSend();
          }}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: canStop ? Colors.sosRed : disabled ? Colors.surface3 : Colors.sosRed,
            opacity: pressed ? 0.78 : 1,
          })}
        >
          {canStop
            ? <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
            : <Send size={18} color={disabled ? Colors.textFaint : '#FFFFFF'} />}
        </Pressable>
      </View>
      {remaining <= 80 ? (
        <Text style={{ color: remaining <= 20 ? Colors.warningAmber : Colors.textFaint, ...Typography.caption, textAlign: 'right', paddingHorizontal: Spacing.sm }}>
          {remaining} characters left
        </Text>
      ) : null}
    </View>
  );
}
