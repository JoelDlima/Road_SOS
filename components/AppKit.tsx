import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { ArrowLeft, LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

type Tone = 'red' | 'green' | 'blue' | 'amber' | 'indigo' | 'neutral';

const toneColor: Record<Tone, string> = {
  red: Colors.sosRed,
  green: Colors.safeGreen,
  blue: Colors.infoBlue,
  amber: Colors.warningAmber,
  indigo: Colors.indigoAccent,
  neutral: Colors.textMuted,
};

export function colorForTone(tone: Tone): string {
  return toneColor[tone];
}

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flex: 1, backgroundColor: Colors.background }, style]}>{children}</View>;
}

export function Header({
  title,
  subtitle,
  right,
  showBack = false,
  fallback = '/(tabs)',
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showBack?: boolean;
  fallback?: string;
}) {
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={goBack}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? Colors.surface2 : Colors.surface,
            borderWidth: 1,
            borderColor: Colors.border,
          })}
        >
          <ArrowLeft size={21} color={Colors.textPrimary} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: Colors.textPrimary, ...Typography.h2 }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: Colors.textMuted, ...Typography.caption, marginTop: 3 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

export function Panel({
  children,
  style,
  tone = 'neutral',
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: Tone;
  padded?: boolean;
}) {
  const color = colorForTone(tone);
  return (
    <View
      style={[
        {
          backgroundColor: Colors.surface,
          borderRadius: Radius.card,
          borderWidth: 1,
          borderColor: tone === 'neutral' ? Colors.border : `${color}44`,
          padding: padded ? Spacing.md : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({
  label,
  action,
  style,
}: {
  label: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xl, marginBottom: Spacing.sm }, style]}>
      <Text style={{ color: Colors.textMuted, ...Typography.label }}>{label.toUpperCase()}</Text>
      {action}
    </View>
  );
}

export function IconBadge({ Icon, tone = 'neutral', size = 40 }: { Icon: LucideIcon; tone?: Tone; size?: number }) {
  const color = colorForTone(tone);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(8, Math.round(size * 0.28)),
        backgroundColor: `${color}18`,
        borderWidth: 1,
        borderColor: `${color}30`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={Math.round(size * 0.46)} color={color} />
    </View>
  );
}

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const color = colorForTone(tone);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: Radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: `${color}16`,
        borderWidth: 1,
        borderColor: `${color}38`,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ color, fontSize: 11, lineHeight: 14, fontWeight: '800' }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  tone = 'red',
  disabled = false,
  Icon,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  Icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}) {
  const color = colorForTone(tone);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          borderRadius: Radius.input,
          backgroundColor: disabled ? Colors.surface3 : color,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: Spacing.xs,
          opacity: pressed ? 0.82 : 1,
          paddingHorizontal: Spacing.md,
        },
        style,
      ]}
    >
      {Icon ? <Icon size={18} color={disabled ? Colors.textFaint : '#FFFFFF'} /> : null}
      <Text style={{ color: disabled ? Colors.textFaint : '#FFFFFF', ...Typography.buttonLarge }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  tone = 'neutral',
  Icon,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  Icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}) {
  const color = colorForTone(tone);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 46,
          borderRadius: Radius.input,
          borderWidth: 1,
          borderColor: `${color}35`,
          backgroundColor: pressed ? `${color}18` : Colors.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: Spacing.xs,
          paddingHorizontal: Spacing.md,
          opacity: pressed ? 0.86 : 1,
        },
        style,
      ]}
    >
      {Icon ? <Icon size={17} color={color} /> : null}
      <Text style={{ color, ...Typography.button }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  tone = 'blue',
  Icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: Tone;
  Icon?: LucideIcon;
}) {
  const color = colorForTone(tone);
  const fg = selected ? color : Colors.textMuted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 36,
        borderRadius: Radius.pill,
        paddingHorizontal: 13,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: selected ? `${color}1F` : Colors.surface2,
        borderWidth: 1,
        borderColor: selected ? `${color}80` : Colors.border,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      {Icon ? <Icon size={14} color={fg} strokeWidth={2.2} /> : null}
      <Text style={{ color: fg, fontSize: 13, lineHeight: 18, fontWeight: '700' }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Avatar({
  initials,
  onPress,
  size = 40,
}: {
  initials: string;
  onPress?: () => void;
  size?: number;
}) {
  const content = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.surface2,
        borderWidth: 1,
        borderColor: `${Colors.sosRed}59`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: Colors.textPrimary, fontSize: Math.round(size * 0.32), fontWeight: '800', letterSpacing: 0.3 }}>
        {initials || '·'}
      </Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {content}
    </Pressable>
  );
}

export function Switch({
  value,
  onValueChange,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={10}
      onPress={() => onValueChange(!value)}
      style={{
        width: 46,
        height: 28,
        borderRadius: 14,
        backgroundColor: value ? Colors.sosRed : Colors.surface3,
        padding: 3,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: '#FFFFFF',
          alignSelf: value ? 'flex-end' : 'flex-start',
        }}
      />
    </Pressable>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: Colors.border }, style]} />;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline,
  style,
  ...rest
}: TextInputProps & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ color: Colors.textMuted, ...Typography.label }}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textFaint}
        selectionColor={Colors.sosRed}
        multiline={multiline}
        style={[
          {
            minHeight: multiline ? 86 : 48,
            textAlignVertical: multiline ? 'top' : 'center',
            borderRadius: Radius.input,
            borderWidth: 1,
            borderColor: error ? Colors.sosRed : Colors.border,
            backgroundColor: Colors.surface2,
            color: Colors.textPrimary,
            fontSize: 15,
            lineHeight: 21,
            paddingHorizontal: Spacing.md,
            paddingVertical: multiline ? Spacing.sm : 0,
          },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={{ color: Colors.sosRed, ...Typography.caption }}>{error}</Text> : null}
    </View>
  );
}

export function DataRow({
  label,
  value,
  valueColor = Colors.textPrimary,
  style,
}: {
  label: string;
  value: string;
  valueColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, paddingVertical: 10 }, style]}>
      <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
      <Text style={{ color: valueColor, fontSize: 14, lineHeight: 20, fontWeight: '700', flexShrink: 1, textAlign: 'right' }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md }}>
      <ActivityIndicator color={Colors.sosRed} />
      <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, body, Icon }: { title: string; body?: string; Icon?: LucideIcon }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm }}>
      {Icon ? <IconBadge Icon={Icon} tone="neutral" size={52} /> : null}
      <Text style={{ color: Colors.textPrimary, ...Typography.h3, textAlign: 'center' }}>{title}</Text>
      {body ? <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, textAlign: 'center' }}>{body}</Text> : null}
    </View>
  );
}
