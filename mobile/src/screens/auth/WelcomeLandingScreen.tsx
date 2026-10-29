import React, { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthHeader } from '../../components/ui/AuthHeader';
import { WELCOME_FEATURES, WELCOME_HERO_IMAGE } from '../../constants/welcomeContent';
import { useResponsive } from '../../hooks/useResponsive';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { colors, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const WELCOME_MAX_WIDTH = 448;

function HeroGradient() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="welcomeHeroFade" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={colors.canvas} stopOpacity="0.55" />
          <Stop offset="0.45" stopColor={colors.canvas} stopOpacity="0.08" />
          <Stop offset="1" stopColor={colors.canvas} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#welcomeHeroFade)" />
    </Svg>
  );
}

type FeatureCardProps = {
  feature: (typeof WELCOME_FEATURES)[number];
  index: number;
};

function FeatureCard({ feature, index }: FeatureCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    const delay = 120 + index * 90;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, opacity, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (feature.variant === 'primary') {
    return (
      <Animated.View
        className="rounded-[20px] p-5"
        style={[cardStyle, { backgroundColor: colors.primarySoft }]}>
        <View
          className="mb-3 h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.surface }}>
          <Text className="text-xl">{feature.icon}</Text>
        </View>
        <Text className="text-lg font-bold text-ink">{feature.title}</Text>
        <Text className="mt-2 text-sm leading-5 text-ink-muted">{feature.body}</Text>
      </Animated.View>
    );
  }

  if (feature.variant === 'insight') {
    return (
      <Animated.View
        className="rounded-[20px] p-5"
        style={[cardStyle, { backgroundColor: colors.insight }]}>
        <View className="mb-3 flex-row items-start justify-between">
          <View
            className="h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: colors.surface }}>
            <Text className="text-lg" style={{ color: colors.tertiary }}>
              {feature.icon}
            </Text>
          </View>
          <View
            className="flex-row items-center rounded-full px-3 py-1"
            style={{ backgroundColor: 'rgba(100, 94, 72, 0.12)' }}>
            <Text className="text-xs font-bold" style={{ color: colors.tertiary }}>
              {feature.badge}
            </Text>
          </View>
        </View>
        <Text
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: colors.tertiary }}>
          {feature.title}
        </Text>
        <Text className="mt-2 text-sm leading-5" style={{ color: colors.tertiary }}>
          {feature.body}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      className="flex-row items-center gap-3.5 rounded-[20px] p-4"
      style={[cardStyle, { backgroundColor: colors.surfaceContainer }]}>
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.secondaryContainer }}>
        <Text className="text-lg font-bold" style={{ color: colors.onSecondaryContainer }}>
          {feature.icon}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-ink">{feature.title}</Text>
        <Text className="mt-1 text-sm leading-5 text-ink-muted">{feature.body}</Text>
      </View>
    </Animated.View>
  );
}

export function WelcomeLandingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, horizontalPadding, isCompact } = useResponsive();
  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(16);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    heroY.value = withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [heroOpacity, heroY]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));

  const maxWidth = Math.min(contentMaxWidth, WELCOME_MAX_WIDTH);
  const sidePad = horizontalPadding;
  const heroHeight = isCompact ? 220 : 280;

  return (
    <View className="flex-1 bg-canvas">
      <AuthHeader horizontalPadding={sidePad} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: sidePad,
          paddingTop: spacing.sm,
          paddingBottom: Math.max(insets.bottom, 24) + 32,
          maxWidth,
          alignSelf: 'center',
          width: '100%',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Animated.View className="mb-8 items-center" style={heroStyle}>
          <View
            className="mb-6 w-full overflow-hidden rounded-[24px]"
            style={{
              height: heroHeight,
              backgroundColor: colors.surfaceContainer,
            }}>
            <Image
              source={{ uri: WELCOME_HERO_IMAGE }}
              className="h-full w-full"
              resizeMode="cover"
              accessibilityLabel="FluentAI tutor illustration with floating language bubbles"
            />
            <HeroGradient />
          </View>
          <Text
            className="text-center font-extrabold tracking-tight text-ink"
            style={{
              fontSize: isCompact ? 34 : 40,
              lineHeight: isCompact ? 40 : 46,
            }}>
            Learn language{'\n'}
            <Text style={{ color: colors.accent }}>effortlessly</Text>
          </Text>
          <Text className="mt-3 max-w-[300px] text-center text-base leading-6 text-ink-muted">
            Practice conversations, build vocabulary, and hit daily goals with a calm AI tutor.
          </Text>
        </Animated.View>

        <View className="mb-8 gap-3">
          {WELCOME_FEATURES.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </View>

        <View className="gap-3">
          <Button
            title="Get started"
            variant="lavender"
            onPress={() => navigation.navigate('CreateAccount')}
          />
          <Button
            title="I already have an account"
            variant="outline"
            onPress={() => navigation.navigate('SignIn')}
          />
        </View>
      </ScrollView>
    </View>
  );
}
