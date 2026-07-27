import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { softShadow } from '../../theme/glass';
import { colors } from '../../theme/tokens';

type ProfileAvatarProps = {
  uri?: string | null;
  initials: string;
  name?: string;
  size?: 'sm' | 'lg';
  editable?: boolean;
  onEditPress?: () => void;
};

const SIZES = {
  sm: { outer: 40, text: 'text-sm', edit: 0 },
  lg: { outer: 128, text: 'text-4xl', edit: 40 },
} as const;

export function ProfileAvatar({
  uri,
  initials,
  name,
  size = 'sm',
  editable = false,
  onEditPress,
}: ProfileAvatarProps) {
  const dim = SIZES[size];
  const a11yLabel = name ? `${name}'s profile photo` : 'Profile photo';

  return (
    <View className="relative" accessibilityLabel={a11yLabel}>
      <View
        className={`items-center justify-center overflow-hidden rounded-full ${size === 'lg' ? 'border-4 border-white' : 'border-2'}`}
        style={[
          size === 'lg' ? softShadow() : undefined,
          {
            width: dim.outer,
            height: dim.outer,
            borderColor: size === 'lg' ? colors.surface : colors.primarySoft,
            backgroundColor: colors.primarySoft,
          },
        ]}>
        {uri ? (
          <Image
            source={{ uri }}
            accessibilityLabel={a11yLabel}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <Text className={`${dim.text} font-bold text-brand`}>{initials}</Text>
        )}
      </View>

      {editable && onEditPress ? (
        <Pressable
          onPress={onEditPress}
          accessibilityLabel="Change profile photo"
          className="absolute bottom-1 right-0 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.primary, ...softShadow(6) }}>
          <Text className="text-base text-white">✎</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
