import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FluentAIBrand } from '../brand/FluentAILogo';
import { useResponsive } from '../../hooks/useResponsive';
import { colors } from '../../theme/tokens';

type StitchHeaderProps = {
  title?: string;
  streakLabel?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

export function StitchHeader({
  title = 'FluentAI',
  streakLabel,
  leading,
  trailing,
}: StitchHeaderProps) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();

  return (
    <View
      className="flex-row items-center justify-between bg-canvas"
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 8,
        paddingHorizontal: horizontalPadding,
      }}>
      <View className="flex-1 flex-row items-center gap-3">
        {leading ?? (title === 'FluentAI' ? <FluentAIBrand iconSize={40} /> : null)}
        {title !== 'FluentAI' || leading ? (
          <Text className="text-2xl font-bold text-brand">{title}</Text>
        ) : null}
      </View>
      {trailing ??
        (streakLabel ? (
          <View
            className="rounded-full px-4 py-1.5"
            style={{ backgroundColor: colors.primarySoft }}>
            <Text className="text-sm font-bold text-brand">{streakLabel}</Text>
          </View>
        ) : null)}
    </View>
  );
}

export function UserAvatar({
  initials,
  size = 40,
}: {
  initials: string;
  size?: number;
}) {
  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full border-2"
      style={{
        width: size,
        height: size,
        borderColor: colors.primarySoft,
        backgroundColor: colors.surfaceContainerHighest,
      }}>
      <Text className="text-sm font-bold text-brand">{initials}</Text>
    </View>
  );
}
