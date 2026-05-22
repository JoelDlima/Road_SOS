import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Download, X, Database, Loader, CirclePause, CirclePlay } from 'lucide-react-native';
import {
  MODELS,
  ModelVariant,
  startOrResumeDownload,
  pauseDownload,
  cancelDownload,
  subscribeToDownload,
  getCurrentDownload,
  DownloadProgress,
} from '../lib/local-llm';
import { ShieldCheck } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';
import * as Haptics from 'expo-haptics';

const SURFACE2 = Colors.surface2;
const RED = Colors.sosRed;
const AMBER = Colors.warningAmber;
const BORDER = Colors.border;
const MUTED = Colors.textMuted;
const PRIMARY = Colors.textPrimary;

type Props = {
  onComplete: (variant: ModelVariant) => void;
  onSkip: () => void;
};

export const ModelDownloader = React.memo(function ModelDownloader({ onComplete, onSkip }: Props) {
  const VARIANT: ModelVariant = 'roadsos_3b_finetuned';
  const [progress, setProgress] = useState<DownloadProgress | null>(getCurrentDownload());

  // Subscribe to the global, persistent download manager. This lets the UI
  // pick up an already-running download (e.g. resumed on app launch from
  // _layout.tsx) and stay in sync if the user navigates away and back.
  useEffect(() => {
    const initial = getCurrentDownload();
    if (initial) setProgress(initial);
    const unsubscribe = subscribeToDownload((p) => setProgress(p));
    return unsubscribe;
  }, []);

  // Once the manager reports completion, propagate to the parent screen.
  useEffect(() => {
    if (progress?.status === 'completed') {
      onComplete(progress.variant);
    } else if (progress?.status === 'error' && progress.error) {
      const variant = progress.variant;
      Alert.alert('Download failed', progress.error, [
        { text: 'Retry', onPress: () => void startOrResumeDownload(variant) },
        { text: 'OK' },
      ]);
    }
  }, [progress, onComplete]);

  function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function startDownload() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void startOrResumeDownload(VARIANT);
  }

  function resume() {
    Haptics.selectionAsync();
    if (!progress) return;
    void startOrResumeDownload(progress.variant);
  }

  function pause() {
    Haptics.selectionAsync();
    void pauseDownload();
  }

  function discard() {
    Alert.alert(
      'Discard download?',
      'This will delete the partial file. You will have to start over from 0% next time.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            Haptics.selectionAsync();
            void cancelDownload();
          },
        },
      ],
    );
  }

  // Active or paused download → show the progress UI (works for both states).
  if (progress && progress.status !== 'idle' && progress.status !== 'completed') {
    const model = MODELS[progress.variant];
    const pct = Math.round(progress.progress * 100);
    const isPaused = progress.status === 'paused';

    return (
      <View style={{ alignItems: 'center', paddingTop: Spacing.lg }}>
        <View
          style={{
            width: 128,
            height: 128,
            borderRadius: 64,
            backgroundColor: (isPaused ? AMBER : RED) + '15',
            borderWidth: 3,
            borderColor: isPaused ? AMBER : RED,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.xl,
          }}
        >
          {progress.bytesWritten === 0 && !isPaused ? (
            <Loader size={36} color={RED} />
          ) : (
            <Text style={{ color: isPaused ? AMBER : RED, fontSize: 30, fontWeight: '800' }}>
              {pct}%
            </Text>
          )}
        </View>

        <View
          style={{
            width: '100%',
            height: 6,
            backgroundColor: SURFACE2,
            borderRadius: 3,
            marginBottom: Spacing.sm,
            overflow: 'hidden',
          }}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: pct }}
          accessibilityLabel={`Download progress: ${pct}%`}
        >
          <View
            style={{
              height: '100%',
              width: `${pct}%`,
              backgroundColor: isPaused ? AMBER : RED,
              borderRadius: 3,
            }}
          />
        </View>

        <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 16, marginBottom: Spacing.xs }}>
          {isPaused ? 'Paused' : 'Downloading'} {model.name}
        </Text>
        <Text style={{ color: MUTED, fontSize: 13, marginBottom: Spacing.xs }}>
          {formatBytes(progress.bytesWritten)} of {formatBytes(progress.totalBytes || model.sizeBytes)}
        </Text>
        <Text style={{ color: MUTED, fontSize: 12, marginBottom: Spacing.xxl, textAlign: 'center', maxWidth: 280 }}>
          You can close the app — progress is saved and resumes automatically.
        </Text>

        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {isPaused ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Resume download"
              accessibilityHint="Continues downloading from where it stopped"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.sm,
                backgroundColor: RED,
                borderRadius: Radius.pill,
                opacity: pressed ? 0.85 : 1,
              })}
              onPress={resume}
            >
              <CirclePlay size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Resume</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pause download"
              accessibilityHint="Stops the download but keeps progress so you can resume later"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.sm,
                backgroundColor: SURFACE2,
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: BORDER,
                opacity: pressed ? 0.7 : 1,
              })}
              onPress={pause}
            >
              <CirclePause size={16} color={PRIMARY} />
              <Text style={{ color: PRIMARY, fontWeight: '600', fontSize: 14 }}>Pause</Text>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discard download"
            accessibilityHint="Deletes the partial file and exits the download"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.xs,
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.sm,
              backgroundColor: SURFACE2,
              borderRadius: Radius.pill,
              borderWidth: 1,
              borderColor: BORDER,
              opacity: pressed ? 0.7 : 1,
            })}
            onPress={discard}
          >
            <X size={16} color={MUTED} />
            <Text style={{ color: MUTED, fontWeight: '600', fontSize: 14 }}>Discard</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const model = MODELS[VARIANT];

  return (
    <View>
      {/* Single model card — RoadSoS fine-tuned only */}
      <View
        style={{
          backgroundColor: RED + '12',
          borderRadius: Spacing.lg,
          borderWidth: 1.5,
          borderColor: RED,
          padding: Spacing.lg,
          marginBottom: Spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
          <ShieldCheck size={18} color={RED} />
          <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 16, marginLeft: Spacing.sm }}>
            {model.name}
          </Text>
          <View style={{ flex: 1 }} />
          <View
            style={{
              backgroundColor: RED + '20',
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: Radius.pill,
              borderWidth: 1,
              borderColor: RED + '50',
              marginRight: Spacing.xs,
            }}
          >
            <Text style={{ color: RED, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>TRAINED</Text>
          </View>
          <View
            style={{
              backgroundColor: RED + '22',
              paddingHorizontal: Spacing.sm,
              paddingVertical: Spacing.xs,
              borderRadius: Radius.pill,
              borderWidth: 1,
              borderColor: RED + '50',
            }}
          >
            <Text style={{ color: RED, fontSize: 12, fontWeight: '700' }}>{model.sizeLabel}</Text>
          </View>
        </View>
        <Text style={{ color: MUTED, fontSize: 13, lineHeight: 18 }}>{model.description}</Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: AMBER + '10',
          borderRadius: Radius.input,
          borderWidth: 1,
          borderColor: AMBER + '30',
          padding: Spacing.md,
          marginBottom: Spacing.xl,
          gap: Spacing.sm,
        }}
      >
        <Database size={20} color={AMBER} style={{ marginTop: 2 }} />
        <Text style={{ color: MUTED, fontSize: 13, flex: 1, lineHeight: 18 }}>
          Requires {model.sizeLabel} of free storage. Download once, then use it without internet. Progress is saved if you close the app — it resumes automatically.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Download ${model.name}`}
        accessibilityHint="Starts downloading the AI model for offline use"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.sm,
          backgroundColor: RED,
          borderRadius: Radius.pill,
          height: 58,
          opacity: pressed ? 0.85 : 1,
          shadowColor: RED,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
          marginBottom: Spacing.sm,
        })}
        onPress={startDownload}
      >
        <Download size={20} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 }}>
          Download {model.name}
        </Text>
      </Pressable>

      <Pressable
        accessibilityLabel="Skip model download, use cloud AI"
        accessibilityHint="Continues without downloading the offline AI model"
        style={({ pressed }) => ({ alignItems: 'center', paddingVertical: Spacing.md, minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
        onPress={() => { Haptics.selectionAsync(); onSkip(); }}
      >
        <Text style={{ color: MUTED, fontSize: 14 }}>Skip and use cloud AI for now</Text>
      </Pressable>
    </View>
  );
});
