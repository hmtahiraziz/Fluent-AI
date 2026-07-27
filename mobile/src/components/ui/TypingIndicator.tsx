import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/tokens';

function Dot({ delay }: { delay: number }) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 280 }),
          withTiming(0, { duration: 280 }),
        ),
        -1,
      ),
    );
  }, [delay, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: colors.inkMuted,
          marginHorizontal: 3,
        },
        style,
      ]}
    />
  );
}

export function TypingIndicator() {
  return (
    <View className="flex-row items-center rounded-2xl border border-border bg-surface px-4 py-3 self-start">
      <Dot delay={0} />
      <Dot delay={120} />
      <Dot delay={240} />
    </View>
  );
}
