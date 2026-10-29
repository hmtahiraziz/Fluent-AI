import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { TabRouteName } from '../theme/tabBar';
import { colors, radii } from '../theme/tokens';
import { TabIcon } from './TabIcons';

const INDICATOR_TIMING = { duration: 180 } as const;

type TabBarItemProps = {
  name: TabRouteName;
  label: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  compact: boolean;
  iconSize: number;
};

export function TabBarItem({
  name,
  label,
  focused,
  onPress,
  onLongPress,
  compact,
  iconSize,
}: TabBarItemProps) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, INDICATOR_TIMING);
  }, [focused, progress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', colors.primarySoft],
    ),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.inkFaint, colors.primary],
    ),
  }));

  const iconColor = focused ? colors.primary : colors.inkFaint;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      // Kill Android ripple / iOS highlight — selection is shown via indicator only.
      android_disableSound
      android_ripple={
        Platform.OS === 'android' ? { color: 'transparent' } : undefined
      }
      unstable_pressDelay={0}
      hitSlop={{ top: 6, bottom: 6 }}
      style={styles.pressable}>
      <View
        style={[
          styles.inner,
          {
            minHeight: compact ? 48 : 50,
            paddingHorizontal: compact ? 6 : 8,
          },
        ]}>
        <Animated.View
          style={[
            styles.indicator,
            {
              width: compact ? 48 : 52,
              height: compact ? 28 : 30,
              borderRadius: radii.md,
            },
            indicatorStyle,
          ]}>
          <TabIcon name={name} color={iconColor} size={iconSize} />
        </Animated.View>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              fontSize: compact ? 11 : 12,
              fontWeight: focused ? '700' : '500',
            },
            labelStyle,
          ]}>
          {label}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    lineHeight: 14,
    textAlign: 'center',
  },
});
