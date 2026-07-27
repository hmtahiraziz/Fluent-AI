import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { FeatureChipRow } from '../../components/widgets/FeatureChipRow';
import { FluentAILogo } from '../../components/brand/FluentAILogo';
import { GlassCard } from '../../components/ui/GlassCard';
import { buttonShadow } from '../../theme/glass';
import { colors } from '../../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const FEATURES = [
  { emoji: '💬', title: 'AI conversations', desc: 'Practice real dialogues with gentle corrections.' },
  { emoji: '📚', title: 'Smart vocabulary', desc: 'Save phrases from every tutoring session.' },
  { emoji: '🎯', title: 'Daily goals', desc: 'Build streaks with bite-sized practice.' },
] as const;

export function WelcomeLandingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isTablet, horizontalPadding, contentMaxWidth } = useResponsive();
  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(24);
  const sheetY = useSharedValue(40);
  const sheetOpacity = useSharedValue(0);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    heroY.value = withTiming(0, { duration: 650, easing: Easing.out(Easing.cubic) });
    sheetOpacity.value = withDelay(200, withTiming(1, { duration: 550 }));
    sheetY.value = withDelay(200, withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) }));
  }, [heroOpacity, heroY, sheetOpacity, sheetY]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
    transform: [{ translateY: sheetY.value }],
  }));

  if (isTablet) {
    return (
      <View className="flex-1 flex-row bg-mist">
        <Animated.View
          className="flex-1 items-center justify-center px-8"
          style={[{ backgroundColor: colors.lavender }, heroStyle]}>
          <FluentAILogo variant="full" iconSize={88} />
          <Text className="mt-8 max-w-md text-center text-2xl font-extrabold leading-9 text-ink">
            Speak fluently.{'\n'}Learn with your AI tutor.
          </Text>
        </Animated.View>
        <Animated.View className="flex-1 justify-center px-8" style={sheetStyle}>
          <AuthPanel navigation={navigation} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-mist">
      <Animated.View
        className="flex-[1.1] items-center justify-center px-8"
        style={[
          { paddingTop: insets.top, backgroundColor: colors.lavender },
          heroStyle,
        ]}>
        <FluentAILogo variant="full" iconSize={76} />
        <Text className="mt-8 text-center text-2xl font-extrabold leading-9 text-ink">
          Speak fluently.{'\n'}Learn with your AI tutor.
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-ink-muted">
          Personalized practice, vocabulary, and gentle grammar help.
        </Text>
      </Animated.View>
      <Animated.View
        className="rounded-t-[32px] bg-surface px-6 pb-8 pt-8"
        style={[
          buttonShadow(),
          sheetStyle,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}>
        <AuthPanel navigation={navigation} />
      </Animated.View>
    </View>
  );
}

function AuthPanel({ navigation }: { navigation: Props['navigation'] }) {
  return (
    <>
      <FeatureChipRow />
      <View className="mt-6 gap-3">
        {FEATURES.map(f => (
          <GlassCard key={f.title} tint="lavender" className="flex-row items-start gap-3">
            <Text className="text-2xl">{f.emoji}</Text>
            <View className="flex-1">
              <Text className="text-base font-bold text-ink">{f.title}</Text>
              <Text className="mt-1 text-sm leading-5 text-ink-muted">{f.desc}</Text>
            </View>
          </GlassCard>
        ))}
      </View>
      <Button
        title="Get started"
        variant="dark"
        className="mt-8"
        onPress={() => navigation.navigate('CreateAccount')}
      />
      <Button
        title="I already have an account"
        variant="outline"
        className="mt-3"
        onPress={() => navigation.navigate('SignIn')}
      />
    </>
  );
}
