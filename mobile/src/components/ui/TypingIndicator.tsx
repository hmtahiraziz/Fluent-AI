import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
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
  const scale = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350 }),
          withTiming(0.4, { duration: 350 }),
        ),
        -1,
      ),
    );
  }, [delay, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.primary,
          marginHorizontal: 2,
        },
        style,
      ]}
    />
  );
}

export function TypingIndicator() {
  return (
    <View className="mb-4 flex-row items-center gap-3 self-start py-2">
      <View
        className="flex-row items-center rounded-full px-3 py-2"
        style={{ backgroundColor: colors.surfaceContainer }}>
        <Dot delay={0} />
        <Dot delay={160} />
        <Dot delay={320} />
      </View>
      <Text className="text-xs italic text-ink-muted">AI is typing...</Text>
    </View>
  );
}
