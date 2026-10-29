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
  const scale = useSharedValue(0.45);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320 }),
          withTiming(0.45, { duration: 320 }),
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
    <View className="mb-3 flex-row items-center gap-2.5 self-start py-1">
      <View
        className="flex-row items-center rounded-[16px] px-3.5 py-2.5"
        style={{ backgroundColor: colors.surfaceContainer }}>
        <Dot delay={0} />
        <Dot delay={140} />
        <Dot delay={280} />
      </View>
      <Text className="text-xs font-medium text-ink-muted">AI is typing…</Text>
    </View>
  );
}
