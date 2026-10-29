import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from 'react-native-keyboard-controller';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/useResponsive';
import { useTabBarInset } from './AppTabBar';
import { FluentAILogo } from './brand/FluentAILogo';
import { Shimmer } from './ui/Shimmer';
import { colors } from '../theme/tokens';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
  header?: React.ReactNode;
  keyboard?: boolean;
  centered?: boolean;
  hasTabBar?: boolean;
};

export function Screen({
  children,
  scroll = false,
  className = '',
  header,
  keyboard = false,
  centered = false,
  hasTabBar = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { horizontalPadding, contentMaxWidth, isTablet } = useResponsive();
  const tabBarInset = useTabBarInset();
  const sidePad = Math.max((width - contentMaxWidth) / 2, horizontalPadding);
  const bottomPad = hasTabBar ? tabBarInset : insets.bottom + 24;
  const topPad = insets.top + (isTablet ? 12 : 8);

  // flex:1 so FlatList / flex children (Words, Chat) get a real height bound.
  // Without this, lists collapse to ~0 and only a sliver of the header shows.
  const inner = (
    <View
      className={centered ? 'mx-auto w-full' : 'w-full'}
      style={{ maxWidth: contentMaxWidth, flex: 1 }}>
      {header}
      {children}
    </View>
  );

  const body = (
    <View
      className={`flex-1 bg-canvas ${className}`}
      style={{
        paddingTop: topPad,
        paddingBottom: hasTabBar ? 0 : insets.bottom,
      }}>
      <View
        className="flex-1"
        style={{
          paddingHorizontal: sidePad,
          paddingBottom: hasTabBar ? tabBarInset : 0,
        }}>
        {inner}
      </View>
    </View>
  );

  if (scroll) {
    const content = (
      <View
        className={centered ? 'mx-auto w-full' : 'w-full'}
        style={{ maxWidth: contentMaxWidth }}>
        {header}
        {children}
      </View>
    );
    const contentStyle = {
      flexGrow: 1,
      paddingTop: topPad,
      paddingBottom: bottomPad,
      paddingHorizontal: sidePad,
    };

    if (keyboard) {
      return (
        <KeyboardAwareScrollView
          style={{ flex: 1, backgroundColor: colors.canvas }}
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          bottomOffset={24}>
          {content}
        </KeyboardAwareScrollView>
      );
    }

    return (
      <ScrollView
        className="flex-1 bg-canvas"
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator>
        {content}
      </ScrollView>
    );
  }

  if (keyboard) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={8}>
        {body}
      </KeyboardAvoidingView>
    );
  }

  return body;
}

export function SplashScreen() {
  const insets = useSafeAreaInsets();
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.2)) });
    textOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [logoOpacity, logoScale, pulse, textOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View
      className="flex-1 items-center justify-center bg-canvas"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}>
      <View
        className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-10"
        style={{ backgroundColor: colors.accentPill }}
      />
      <View
        className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full opacity-5"
        style={{ backgroundColor: colors.secondaryContainer }}
      />
      <Animated.View style={logoStyle} className="items-center">
        <FluentAILogo variant="full" iconSize={72} />
      </Animated.View>
      <Animated.Text
        style={textStyle}
        className="mt-3 text-base font-medium text-ink-muted">
        Your personal language tutor
      </Animated.Text>
      <Animated.View style={[pulseStyle, { marginTop: 48, width: 120 }]}>
        <Shimmer height={4} borderRadius={4} />
      </Animated.View>
      <Animated.Text
        style={[textStyle, { marginTop: 16 }]}
        className="text-xs font-medium uppercase tracking-widest text-ink-faint">
        Loading
      </Animated.Text>
    </View>
  );
}

export function LoadingScreen() {
  return <SplashScreen />;
}

type SessionRestoreScreenProps = {
  message?: string | null;
  onRetry: () => void;
  retrying?: boolean;
};

/** Shown when Keychain has credentials but session validation failed transiently. */
export function SessionRestoreScreen({
  message,
  onRetry,
  retrying,
}: SessionRestoreScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-canvas px-8"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}>
      <FluentAILogo variant="full" iconSize={64} />
      <Text className="mt-6 text-center text-lg font-bold text-ink">
        Can&apos;t reach FluentAI
      </Text>
      <Text className="mt-2 text-center text-base leading-6 text-ink-muted">
        {message ??
          'Check your connection and try again. Your sign-in was kept on this device.'}
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={retrying}
        onPress={onRetry}
        className="mt-8 min-h-12 min-w-[160px] items-center justify-center rounded-2xl px-6"
        style={{
          backgroundColor: colors.primary,
          opacity: retrying ? 0.7 : 1,
        }}>
        <Text className="text-base font-bold text-white">
          {retrying ? 'Retrying…' : 'Try again'}
        </Text>
      </Pressable>
    </View>
  );
}
