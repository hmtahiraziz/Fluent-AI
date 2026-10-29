import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { FluentAIBrand } from '../brand/FluentAILogo';
import { PressableScale } from './PressableScale';
import { ProfileAvatar } from './ProfileAvatar';
import { StreakBadge } from './StreakBadge';
import { useProfile } from '../../hooks/useProfile';
import { useResponsive } from '../../hooks/useResponsive';
import { colors } from '../../theme/tokens';

type AppScreenHeaderProps = {
  /** brand = FluentAI logo (tabs); back = chevron + title (stack) */
  variant?: 'brand' | 'back';
  title?: string;
  subtitle?: string;
  streakLabel?: string;
  showAvatar?: boolean;
  showStreak?: boolean;
  onBack?: () => void;
  onAvatarPress?: () => void;
  rightSlot?: React.ReactNode;
};

/**
 * Shared top chrome for Home / Words / Profile / Phrase / Review.
 * Use inside Screen's `header` prop (Screen already applies safe-area padding).
 */
export function AppScreenHeader({
  variant = 'brand',
  title,
  subtitle,
  streakLabel = 'Start today',
  showAvatar = true,
  showStreak = true,
  onBack,
  onAvatarPress,
  rightSlot,
}: AppScreenHeaderProps) {
  const { horizontalPadding } = useResponsive();
  const { initials, avatarUri, resolvedName } = useProfile();

  return (
    <View
      className="bg-canvas pb-3"
      style={{
        marginHorizontal: -horizontalPadding,
        paddingHorizontal: horizontalPadding,
      }}>
      <View className="flex-row items-center justify-between gap-2">
        {variant === 'back' ? (
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.surfaceContainer }}>
              <Text className="text-lg font-bold text-ink">←</Text>
            </Pressable>
            <View className="min-w-0 flex-1">
              {title ? (
                <Text className="text-lg font-extrabold text-ink" numberOfLines={1}>
                  {title}
                </Text>
              ) : (
                <FluentAIBrand
                  iconSize={28}
                  wordmarkClassName="text-lg font-extrabold text-brand"
                />
              )}
              {subtitle ? (
                <Text className="mt-0.5 text-xs font-medium text-ink-muted" numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View className="min-w-0 flex-1">
            <FluentAIBrand
              iconSize={32}
              wordmarkClassName="text-xl font-extrabold text-brand"
            />
            {title || subtitle ? (
              <View className="mt-1">
                {title ? (
                  <Text className="text-sm font-bold text-ink" numberOfLines={1}>
                    {title}
                  </Text>
                ) : null}
                {subtitle ? (
                  <Text className="text-xs font-medium text-ink-muted" numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        )}

        <View className="flex-row items-center gap-2.5">
          {rightSlot}
          {showStreak ? <StreakBadge label={streakLabel} /> : null}
          {showAvatar ? (
            <PressableScale
              onPress={onAvatarPress}
              disabled={!onAvatarPress}
              accessibilityLabel="Open profile">
              <ProfileAvatar
                uri={avatarUri}
                initials={initials}
                name={resolvedName}
                size="sm"
              />
            </PressableScale>
          ) : null}
        </View>
      </View>
    </View>
  );
}
