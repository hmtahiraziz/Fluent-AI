import React, { useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useOnboarding } from '../context/OnboardingContext';
import { DailyGoalScreen } from '../screens/onboarding/DailyGoalScreen';
import { LevelScreen } from '../screens/onboarding/LevelScreen';
import { MotivationScreen } from '../screens/onboarding/MotivationScreen';
import { NativeLanguageScreen } from '../screens/onboarding/NativeLanguageScreen';
import { PlanReadyScreen } from '../screens/onboarding/PlanReadyScreen';
import { TargetLanguageScreen } from '../screens/onboarding/TargetLanguageScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const STEP_ROUTES: Record<number, keyof OnboardingStackParamList> = {
  1: 'NativeLanguage',
  2: 'TargetLanguage',
  3: 'Motivation',
  4: 'Level',
  5: 'DailyGoal',
  6: 'PlanReady',
};

export function OnboardingNavigator() {
  const { draft } = useOnboarding();
  const initialRoute = useMemo(
    () => STEP_ROUTES[draft.step] ?? 'NativeLanguage',
    [draft.step],
  );

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="NativeLanguage" component={NativeLanguageScreen} />
      <Stack.Screen name="TargetLanguage" component={TargetLanguageScreen} />
      <Stack.Screen name="Motivation" component={MotivationScreen} />
      <Stack.Screen name="Level" component={LevelScreen} />
      <Stack.Screen name="DailyGoal" component={DailyGoalScreen} />
      <Stack.Screen name="PlanReady" component={PlanReadyScreen} />
    </Stack.Navigator>
  );
}
