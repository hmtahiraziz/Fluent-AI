import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';
import { AppIconMark } from './AppIconMark';

type TutorAvatarProps = {
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
};

const sizes = { sm: 36, md: 48, lg: 64 } as const;

export function TutorAvatar({ size = 'md', style }: TutorAvatarProps) {
  const px = sizes[size];
  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <View
        style={{
          padding: 3,
          borderRadius: px / 2 + 6,
          borderWidth: 2,
          borderColor: colors.primaryLight,
          backgroundColor: `${colors.primary}18`,
        }}>
        <AppIconMark size={px} />
      </View>
      {size === 'lg' ? (
        <Text className="mt-2 text-xs font-semibold text-ink-muted">FluentAI Tutor</Text>
      ) : null}
    </View>
  );
}
