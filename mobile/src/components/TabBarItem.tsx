import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { TabRouteName } from '../theme/tabBar';
import { colors } from '../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TabGlyphProps = {
  name: TabRouteName;
  focused: boolean;
  size: number;
  dark?: boolean;
};

export function TabGlyph({ name, focused, size, dark }: TabGlyphProps) {
  const color = dark
    ? focused
      ? colors.primary
      : 'rgba(255,255,255,0.55)'
    : focused
      ? colors.primary
      : colors.inkFaint;
  const stroke = Math.max(2, Math.round(size * 0.09));

  if (name === 'Practice') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: size * 0.72,
            height: size * 0.62,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: size * 0.12,
            borderTopRightRadius: size * 0.12,
            borderBottomLeftRadius: size * 0.06,
            borderBottomRightRadius: size * 0.06,
            marginTop: size * 0.08,
          }}
        />
      </View>
    );
  }

  if (name === 'Vocabulary') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: size * 0.62,
            height: size * 0.78,
            borderWidth: stroke,
            borderColor: color,
            borderRadius: size * 0.08,
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.44,
          height: size * 0.44,
          borderRadius: size * 0.22,
          borderWidth: stroke,
          borderColor: color,
        }}
      />
    </View>
  );
}

type TabBarItemProps = {
  name: TabRouteName;
  label: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  compact: boolean;
  iconSize: number;
  dark?: boolean;
};

export function TabBarItem({
  name,
  label,
  focused,
  onPress,
  onLongPress,
  compact,
  iconSize,
  dark = false,
}: TabBarItemProps) {
  const scale = useSharedValue(focused ? 1 : 0.92);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.92, { damping: 18, stiffness: 280 });
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-1 items-center justify-center"
      style={[{ minHeight: compact ? 52 : 56 }, animStyle]}>
      <View
        className="items-center justify-center rounded-full px-4 py-2"
        style={{
          minWidth: compact ? 72 : 80,
          backgroundColor: focused ? colors.lavender : 'transparent',
        }}>
        <TabGlyph name={name} focused={focused} size={iconSize} dark={dark} />
        <Text
          className="mt-1 text-center font-semibold"
          style={{
            fontSize: compact ? 10 : 11,
            color: dark
              ? focused
                ? colors.ink
                : 'rgba(255,255,255,0.7)'
              : focused
                ? colors.primary
                : colors.inkFaint,
          }}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}
