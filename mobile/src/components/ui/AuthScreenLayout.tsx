import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardInset } from '../../hooks/useKeyboardInset';

type AuthScreenLayoutProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  overlay?: React.ReactNode;
  horizontalPadding: number;
  contentMaxWidth: number;
  centerContent?: boolean;
  contentPaddingTop?: number;
  bottomPadding?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function AuthScreenLayout({
  children,
  header,
  footer,
  overlay,
  horizontalPadding,
  contentMaxWidth,
  centerContent = false,
  contentPaddingTop = 0,
  bottomPadding = 24,
  contentContainerStyle,
}: AuthScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardInset();
  const iosKeyboardPadding = Platform.OS === 'ios' ? keyboardHeight : 0;

  return (
    <View className="flex-1 bg-canvas">
      {header}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            {
              flexGrow: 1,
              paddingHorizontal: horizontalPadding,
              paddingTop: contentPaddingTop + (centerContent ? 48 : 16),
              paddingBottom: Math.max(insets.bottom, bottomPadding) + iosKeyboardPadding,
              maxWidth: contentMaxWidth,
              alignSelf: 'center',
              width: '100%',
            },
            contentContainerStyle,
          ]}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      {footer}
      {overlay}
    </View>
  );
}
