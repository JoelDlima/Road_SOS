import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Mic, MicOff, Video, VideoOff, Wifi } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GhostButton, Header, IconBadge, Panel, PrimaryButton, Screen, StatusPill } from '../../components/AppKit';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { useVideoStream } from '../../hooks/useVideoStream';

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function StreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isStreaming, peerConnected, error, isMuted, startStream, stopStream, toggleMute } = useVideoStream(id ?? null);
  const [started, setStarted] = useState(false);
  const [duration, setDuration] = useState(0);
  const prompted = useRef(false);
  const stopRef = useRef(stopStream);
  stopRef.current = stopStream;

  useEffect(() => {
    if (!id || prompted.current) return;
    prompted.current = true;
    Alert.alert('Start live stream?', 'This will broadcast camera and microphone access for emergency responders.', [
      { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
      {
        text: 'Start',
        onPress: () => {
          startStream();
          setStarted(true);
        },
      },
    ]);

    return () => {
      stopRef.current();
    };
  }, [id, startStream]);

  useEffect(() => {
    if (!started || !isStreaming) return;
    const timer = setInterval(() => setDuration((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [isStreaming, started]);

  function endStream() {
    Alert.alert('End live stream?', 'Stop sharing camera and microphone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: () => {
          stopStream();
          setStarted(false);
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)');
        },
      },
    ]);
  }

  const statusTone = peerConnected ? 'green' : isStreaming ? 'amber' : 'neutral';
  const statusLabel = peerConnected ? 'Connected' : isStreaming ? 'Waiting' : 'Starting';

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Header title="Live stream" subtitle={id ? `Incident ${id.slice(0, 8).toUpperCase()}` : 'No incident'} showBack right={<StatusPill label={statusLabel} tone={statusTone} />} />
      <View style={{ flex: 1, padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.xl, justifyContent: 'center' }}>
        {error ? (
          <Panel tone="red" style={{ gap: Spacing.md, alignItems: 'center' }}>
            <IconBadge Icon={VideoOff} tone="red" size={58} />
            <Text style={{ color: Colors.textPrimary, ...Typography.h2 }}>Stream unavailable</Text>
            <Text style={{ color: Colors.textMuted, ...Typography.bodySmall, textAlign: 'center' }}>{error}</Text>
            <GhostButton label="Go back" onPress={() => router.back()} />
          </Panel>
        ) : !isStreaming ? (
          <Panel style={{ gap: Spacing.md, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.infoBlue} />
            <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>Preparing secure stream...</Text>
          </Panel>
        ) : (
          <View style={{ gap: Spacing.md }}>
            <View
              style={{
                aspectRatio: 4 / 3,
                borderRadius: 14,
                backgroundColor: Colors.surface,
                borderWidth: 1,
                borderColor: Colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                gap: Spacing.sm,
              }}
            >
              <IconBadge Icon={Video} tone={peerConnected ? 'green' : 'amber'} size={74} />
              <Text style={{ color: Colors.textPrimary, ...Typography.h3 }}>Camera preview active</Text>
              <Text style={{ color: Colors.textMuted, ...Typography.bodySmall }}>
                {peerConnected ? 'Streaming live to responder session' : 'Waiting for responder connection'}
              </Text>
            </View>

            <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <IconBadge Icon={Wifi} tone={statusTone} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }}>{statusLabel}</Text>
                <Text style={{ color: Colors.textMuted, ...Typography.caption }}>Duration {formatDuration(duration)}</Text>
              </View>
              <StatusPill label={formatDuration(duration)} tone="red" />
            </Panel>

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <GhostButton label={isMuted ? 'Unmute' : 'Mute'} Icon={isMuted ? MicOff : Mic} tone={isMuted ? 'red' : 'neutral'} onPress={toggleMute} style={{ flex: 1 }} />
              <PrimaryButton label="End stream" Icon={VideoOff} onPress={endStream} style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
