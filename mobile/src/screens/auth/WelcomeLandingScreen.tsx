import React, { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WELCOME_FEATURES, WELCOME_HERO_IMAGE } from '../../constants/welcomeContent';
import { useResponsive } from '../../hooks/useResponsive';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { colors, spacing } from '../../theme/tokens';
import { softShadow } from '../../theme/glass';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const WELCOME_MAX_WIDTH = 448;

function WelcomeHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center justify-between bg-canvas"
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 8,
        paddingHorizontal: spacing.container,
      }}>
      <Text className="text-2xl font-bold text-brand">FluentAI</Text>
      <View
        className="rounded-full px-4 py-1.5"
        style={{ backgroundColor: colors.surfaceContainer }}>
        <Text className="text-sm font-bold text-brand">🔥 7 Days</Text>
      </View>
    </View>
  );
}

function HeroGradient() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <LinearGradient id="welcomeHeroFade" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={colors.canvas} stopOpacity="0.4" />
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
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = 120 + index * 100;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, opacity, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (feature.variant === 'primary') {
    return (
      <Animated.View
        className="rounded-[24px] border p-6"
        style={[
          cardStyle,
          { backgroundColor: colors.surface, borderColor: `${colors.border}4D` },
          softShadow(),
        ]}>
        <View
          className="mb-4 h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.primarySoft }}>
          <Text className="text-2xl">{feature.icon}</Text>
        </View>
        <Text className="text-2xl font-bold text-ink">{feature.title}</Text>
        <Text className="mt-1 text-base leading-6 text-ink-muted">{feature.body}</Text>
      </Animated.View>
    );
  }

  if (feature.variant === 'insight') {
    return (
      <Animated.View
        className="rounded-[24px] p-6"
        style={[cardStyle, { backgroundColor: colors.insight }]}>
        <View className="mb-4 flex-row items-start justify-between">
          <View
            className="h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: '#ffffff' }}>
            <Text className="text-lg" style={{ color: colors.tertiary }}>
              {feature.icon}
            </Text>
          </View>
          <View
            className="flex-row items-center rounded-full px-3 py-1"
            style={{ backgroundColor: 'rgba(100, 94, 72, 0.1)' }}>
            <Text className="text-xs font-bold" style={{ color: colors.tertiary }}>
              {feature.badge}
            </Text>
          </View>
        </View>
        <Text
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: colors.tertiary }}>
          {feature.title}
        </Text>
        <Text className="mt-1 text-base leading-6" style={{ color: colors.tertiary }}>
          {feature.body}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      className="flex-row items-center gap-5 rounded-[24px] border p-6"
      style={[
        cardStyle,
        {
          backgroundColor: colors.surfaceContainer,
          borderColor: `${colors.border}33`,
        },
      ]}>
      <View
        className="h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.secondaryContainer }}>
        <Text className="text-2xl font-bold" style={{ color: colors.onSecondaryContainer }}>
          {feature.icon}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-ink">{feature.title}</Text>
        <Text className="mt-1 text-base leading-6 text-ink-muted">{feature.body}</Text>
      </View>
    </Animated.View>
  );
}

export function WelcomeLandingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { contentMaxWidth } = useResponsive();
  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(24);
  const floatY = useSharedValue(0);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    heroY.value = withTiming(0, { duration: 650, easing: Easing.out(Easing.cubic) });
    floatY.value = withRepeat(
      withTiming(-10, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [heroOpacity, heroY, floatY]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const maxWidth = Math.min(contentMaxWidth, WELCOME_MAX_WIDTH);

  return (
    <View className="flex-1 bg-canvas">
      <WelcomeHeader />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.container,
          paddingTop: spacing.lg,
          paddingBottom: Math.max(insets.bottom, 32) + 48,
          maxWidth,
          alignSelf: 'center',
          width: '100%',
        }}
        showsVerticalScrollIndicator={false}>
        <Animated.View className="mb-12 items-center" style={heroStyle}>
          <Animated.View
            className="mb-8 h-72 w-full overflow-hidden rounded-[32px]"
            style={[softShadow(8), floatStyle]}>
            <Image
              source={{ uri: WELCOME_HERO_IMAGE }}
              className="h-full w-full"
              resizeMode="cover"
              accessibilityLabel="FluentAI tutor illustration with floating language bubbles"
            />
            <HeroGradient />
          </Animated.View>
          <Text className="text-center text-[40px] font-extrabold leading-[48px] tracking-tight text-ink">
            Learn language{' '}
            <Text style={{ color: colors.accent }}>effortlessly</Text>
          </Text>
          <Text className="mt-4 max-w-[320px] text-center text-base leading-6 text-ink-muted">
            The emotional journey of language learning, powered by human-centric AI.
          </Text>
        </Animated.View>

        <View className="mb-12 gap-4">
          {WELCOME_FEATURES.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </View>

        <View className="gap-4">
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
