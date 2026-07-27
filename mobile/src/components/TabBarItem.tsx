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

const TAB_ICONS: Record<TabRouteName, { active: string; inactive: string }> = {
  Practice: { active: '🏠', inactive: '🏠' },
  Vocabulary: { active: '📖', inactive: '📖' },
  Settings: { active: '👤', inactive: '👤' },
};

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
  dark = true,
}: TabBarItemProps) {
  const scale = useSharedValue(focused ? 1 : 0.95);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.95, { damping: 18, stiffness: 280 });
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const icon = TAB_ICONS[name];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-1 items-center justify-center"
      style={[{ minHeight: compact ? 52 : 56 }, animStyle]}>
      <View
        className="flex-row items-center justify-center px-5 py-2.5"
        style={{
          backgroundColor: focused ? colors.secondaryContainer : 'transparent',
          borderRadius: 9999,
          overflow: 'hidden',
        }}>
        <Text className="text-base">{focused ? icon.active : icon.inactive}</Text>
        <Text
          className="ml-1.5 text-center text-sm font-bold"
          style={{
            color: dark
              ? focused
                ? colors.onSecondaryContainer
                : colors.surface
              : focused
                ? colors.onSecondaryContainer
                : colors.inkFaint,
          }}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export function TabGlyph({
  name,
  focused,
}: {
  name: TabRouteName;
  focused: boolean;
  size?: number;
  dark?: boolean;
}) {
  return (
    <Text className="text-base">{TAB_ICONS[name][focused ? 'active' : 'inactive']}</Text>
  );
}
