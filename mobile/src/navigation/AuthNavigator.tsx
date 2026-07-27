import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeLandingScreen } from '../screens/auth/WelcomeLandingScreen';
import { CreateAccountScreen } from '../screens/auth/CreateAccountScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Welcome" component={WelcomeLandingScreen} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
    </Stack.Navigator>
  );
}
