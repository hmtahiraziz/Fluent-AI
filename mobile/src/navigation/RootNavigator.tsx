import React, { useEffect, useRef } from 'react';
import {
  NavigationContainer,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import { ChatScreen } from '../screens/ChatScreen';
import { SplashScreen } from '../components/Screen';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';
import { OnboardingNavigator } from './OnboardingNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStack({
  navRef,
}: {
  navRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
}) {
  const { isAuthenticated, isOnboarded, isLoading, pendingChat, setPendingChat } =
    useAuth();

  useEffect(() => {
    if (!pendingChat || !isAuthenticated || !isOnboarded) return;
    const timer = setTimeout(() => {
      navRef.current?.navigate('Chat', pendingChat);
      setPendingChat(null);
    }, 150);
    return () => clearTimeout(timer);
  }, [pendingChat, isAuthenticated, isOnboarded, setPendingChat, navRef]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !isOnboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  return (
    <OnboardingProvider>
      <NavigationContainer ref={navRef}>
        <RootStack navRef={navRef} />
      </NavigationContainer>
    </OnboardingProvider>
  );
}
