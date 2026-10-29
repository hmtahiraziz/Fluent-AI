import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/tokens';
import {
  TAB_BAR_RADIUS,
  TAB_ITEMS,
  resolveTabBarBottomInset,
  tabBarContentGap,
  tabBarContentHeight,
  tabBarIconSize,
  tabBarMaxWidth,
  tabBarOccupiedHeight,
  tabBarSideInset,
  tabBarTopPad,
  type TabRouteName,
} from '../theme/tabBar';
import { TabBarItem } from './TabBarItem';

function AppTabBarComponent({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { breakpoint, width } = useResponsive();
  const contentHeight = tabBarContentHeight(breakpoint);
  const topPad = tabBarTopPad(breakpoint);
  const sideInset = tabBarSideInset(breakpoint);
  const bottomPad = resolveTabBarBottomInset(insets.bottom);
  const maxBarWidth = tabBarMaxWidth(breakpoint) ?? width;
  const iconSize = tabBarIconSize(breakpoint);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.anchor,
        {
          // Fill through the safe-area region so there is no canvas gap
          // between the tab chrome and the system navigation bar.
          paddingTop: topPad,
          paddingBottom: bottomPad,
          backgroundColor: colors.surface,
          borderTopLeftRadius: TAB_BAR_RADIUS,
          borderTopRightRadius: TAB_BAR_RADIUS,
          borderTopColor: colors.borderLight,
        },
      ]}>
      <View
        style={[
          styles.row,
          {
            height: contentHeight,
            maxWidth: maxBarWidth,
            paddingHorizontal: sideInset,
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
            />
          );
        })}
      </View>
    </View>
  );
}

export const AppTabBar = memo(AppTabBarComponent);

/** Bottom padding screens should reserve so content clears the absolute tab bar. */
export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  const { breakpoint } = useResponsive();
  return (
    tabBarOccupiedHeight(breakpoint, insets.bottom) + tabBarContentGap(breakpoint)
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
