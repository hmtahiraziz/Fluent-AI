import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
  lg: { outer: 112, text: 'text-3xl', edit: 36 },
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
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = Boolean(uri) && uri !== failedUri;

  return (
    <View className="relative" accessibilityLabel={a11yLabel}>
      <View
        className="items-center justify-center overflow-hidden rounded-full"
        style={{
          width: dim.outer,
          height: dim.outer,
          backgroundColor: colors.primarySoft,
          borderWidth: size === 'lg' ? 3 : 0,
          borderColor: colors.surface,
        }}>
        {showImage ? (
          <Image
            key={uri ?? undefined}
            source={{ uri: uri! }}
            accessibilityLabel={a11yLabel}
            style={styles.image}
            resizeMode="cover"
            onError={() => setFailedUri(uri ?? null)}
          />
        ) : (
          <Text className={`${dim.text} font-bold text-brand`}>{initials}</Text>
        )}
      </View>

      {editable && onEditPress ? (
        <Pressable
          onPress={onEditPress}
          accessibilityLabel="Change profile photo"
          accessibilityRole="button"
          className="absolute bottom-0 right-0 items-center justify-center rounded-full"
          style={{
            width: dim.edit || 36,
            height: dim.edit || 36,
            backgroundColor: colors.primary,
          }}>
          <Text className="text-sm text-white">✎</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // NativeWind className sizing is unreliable on Image — use explicit layout.
  image: {
    width: '100%',
    height: '100%',
  },
});
