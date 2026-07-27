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
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
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
