import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = PressableProps & {
  children: React.ReactNode;
  scale?: number;
};

export function PressableScale({
  children,
  scale = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) {
  const pressed = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={e => {
        pressed.value = withSpring(scale, { damping: 20, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={e => {
        pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
        onPressOut?.(e);
      }}
      style={style}
      {...props}>
      {children}
    </AnimatedPressable>
  );
}
