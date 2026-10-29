import './global.css';
import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme/tokens';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider preload={false}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.lavenderSoft} />
          <AuthProvider>
            <ProfileProvider>
              <RootNavigator />
            </ProfileProvider>
          </AuthProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
