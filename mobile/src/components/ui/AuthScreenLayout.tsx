import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import {
  KeyboardAwareScrollView,
  useKeyboardState,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';

type AuthScreenLayoutProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  /**
   * When true, header scrolls with form content.
   * Prefer sticky headers (false) so the FluentAI logo stays visible.
   */
  headerScrolls?: boolean;
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
  headerScrolls = false,
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
  const keyboardVisible = useKeyboardState(state => state.isVisible);
  const stickyHeader = header && !headerScrolls ? header : null;
  const scrollingHeader = header && headerScrolls ? header : null;
  const bodyTopPad =
    contentPaddingTop + (scrollingHeader ? spacing.md : centerContent ? spacing.lg : spacing.md);
  // Keep fields above the keyboard; leave a little breathing room under the caret.
  const keyboardBottomOffset = 32 + Math.min(insets.bottom, 16);
  // Vertically centered forms need layout-mode spacing so flex reflows above the keyboard.
  const centerAboveKeyboard = centerContent && !keyboardVisible;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {stickyHeader}

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        mode={centerContent ? 'layout' : 'insets'}
        bottomOffset={keyboardBottomOffset}
        extraKeyboardSpace={centerContent ? spacing.md : 0}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={[
          {
            flexGrow: 1,
            paddingHorizontal: horizontalPadding,
            paddingTop: scrollingHeader ? 0 : bodyTopPad,
            paddingBottom: Math.max(insets.bottom, bottomPadding) + spacing.md,
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
          },
          contentContainerStyle,
        ]}>
        {scrollingHeader ? (
          <View style={{ marginHorizontal: -horizontalPadding }}>
            {scrollingHeader}
          </View>
        ) : null}

        <View
          style={{
            paddingTop: scrollingHeader ? bodyTopPad : 0,
            flexGrow: centerContent ? 1 : undefined,
            // Drop vertical centering while the keyboard is open so OTP/email
            // fields can sit in the remaining space instead of under the keys.
            justifyContent: centerAboveKeyboard ? 'center' : undefined,
          }}>
          {children}
        </View>
      </KeyboardAwareScrollView>

      {footer}
      {overlay}
    </View>
  );
}
