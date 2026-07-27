import React from 'react';
import { View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/useResponsive';
import { navbarShadow } from '../theme/glass';
import { colors } from '../theme/tokens';
import {
  TAB_ITEMS,
  tabBarHeight,
  tabBarMaxWidth,
  type TabRouteName,
} from '../theme/tabBar';
import { TabBarItem } from './TabBarItem';

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { breakpoint, isTablet, width } = useResponsive();
  const barHeight = tabBarHeight(breakpoint, 0);
  const maxBarWidth = tabBarMaxWidth(breakpoint) ?? width - 32;
  const iconSize = isTablet ? 24 : 22;
  const horizontalPad = Math.max((width - maxBarWidth) / 2, 16);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: horizontalPad,
        paddingBottom: Math.max(insets.bottom, 12),
      }}>
      <View
        className="mx-auto w-full flex-row items-center rounded-full px-2"
        style={[
          navbarShadow(),
          {
            height: barHeight,
            maxWidth: maxBarWidth,
            backgroundColor: colors.navDark,
          },
        ]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const routeName = route.name as TabRouteName;
          const meta = TAB_ITEMS[routeName];
          const label =
            options.tabBarLabel !== undefined
              ? String(options.tabBarLabel)
              : options.title ?? meta.label;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabBarItem
              key={route.key}
              name={routeName}
              label={label}
              focused={focused}
              onPress={onPress}
              onLongPress={onLongPress}
              compact={breakpoint === 'compact'}
              iconSize={iconSize}
              dark
            />
          );
        })}
      </View>
    </View>
  );
}

export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  const { breakpoint } = useResponsive();
  return tabBarHeight(breakpoint, 0) + Math.max(insets.bottom, 12) + 16;
}
