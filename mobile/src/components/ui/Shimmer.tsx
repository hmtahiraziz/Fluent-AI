import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme/tokens';

type ShimmerProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  className?: string;
};

export function Shimmer({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  className = '',
}: ShimmerProps) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      className={`overflow-hidden bg-lavender-muted ${className}`}
      style={[{ width, height, borderRadius, backgroundColor: colors.lavenderMuted }, style]}>
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: colors.lavender,
            borderRadius,
          },
          animStyle,
        ]}
      />
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View className="mb-3 rounded-3xl bg-surface p-4">
      <Shimmer height={20} width="60%" borderRadius={8} />
      <View className="mt-3">
        <Shimmer height={14} width="90%" borderRadius={6} />
      </View>
      <View className="mt-2">
        <Shimmer height={14} width="40%" borderRadius={6} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}
