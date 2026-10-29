import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppTabBar } from '../components/AppTabBar';
import { PracticeScreen } from '../screens/PracticeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VocabularyScreen } from '../screens/VocabularyScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <AppTabBar {...props} />}
      // Keep inactive scenes attached so Android tab switches don't flicker/remount.
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        // Mount all tabs once so scroll position and local state survive switches.
        lazy: false,
        freezeOnBlur: true,
        animation: 'none',
      }}>
      <Tab.Screen
        name="Practice"
        component={PracticeScreen}
        options={{ title: 'Home', tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Vocabulary"
        component={VocabularyScreen}
        options={{ title: 'Words', tabBarLabel: 'Words' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Profile', tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
