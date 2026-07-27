import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';

type AppIconMarkProps = {
  size?: number;
  style?: ViewStyle;
};

export function AppIconMark({ size = 48, style }: AppIconMarkProps) {
  const ring = Math.max(2, Math.round(size * 0.06));
  const inner = size - ring * 4;

  return (
    <View
      accessibilityLabel="FluentAI"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: ring,
          borderColor: colors.primaryLight,
        },
        style,
      ]}>
      <View
        style={{
          width: inner * 0.55,
          height: inner * 0.42,
          borderTopLeftRadius: inner * 0.22,
          borderTopRightRadius: inner * 0.22,
          borderBottomLeftRadius: inner * 0.08,
          borderBottomRightRadius: inner * 0.08,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          style={{
            fontSize: inner * 0.28,
            fontWeight: '800',
            color: colors.primary,
            marginTop: -1,
          }}>
          F
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          top: size * 0.12,
          right: size * 0.12,
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: size * 0.11,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontSize: size * 0.12, color: colors.surface, fontWeight: '700' }}>
          ✦
        </Text>
      </View>
    </View>
  );
}
