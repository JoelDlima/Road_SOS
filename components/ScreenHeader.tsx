import React from 'react';
import type { ViewStyle } from 'react-native';
import { Header } from './AppKit';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  fallback?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenHeader = React.memo(function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  fallback = '/(tabs)',
  right,
}: ScreenHeaderProps) {
  return <Header title={title} subtitle={subtitle} right={right} showBack={showBack} fallback={fallback} />;
});
