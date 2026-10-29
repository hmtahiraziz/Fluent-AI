import React from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  View,
} from 'react-native';
import type { Conversation } from '../../../api/types';
import { PressableScale } from '../../../components/ui/PressableScale';
import { softShadow } from '../../../theme/glass';
import { colors } from '../../../theme/tokens';

const tutorHeroArt = require('../../../assets/illustrations/ai-tutor-hero.png');

type PracticeChatHeroProps = {
  resumable: Conversation | null;
  onStartNew: () => void;
  onResume: () => void;
  loading?: boolean;
};

export function PracticeChatHero({
  resumable,
  onStartNew,
  onResume,
  loading = false,
}: PracticeChatHeroProps) {
  const title = resumable ? 'Continue Practice' : 'Start Practice';
  const subtitle = resumable
    ? resumable.title
      ? `Pick up “${resumable.title}” — pick up right where you left off.`
      : "You're building skills step by step. Pick up right where you left off."
    : 'A focused session with your tutor — short, clear, and on your level.';

  return (
    <View
      className="mb-5 overflow-hidden rounded-[28px]"
      style={[
        {
          backgroundColor: colors.insight,
          borderWidth: 1,
          borderColor: colors.insightBorder,
        },
        softShadow(3),
      ]}>
      {/* Soft depth accents */}
      <View
        pointerEvents="none"
        className="absolute -right-8 -top-10 h-36 w-36 rounded-full"
        style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)' }}
      />
      <View
        pointerEvents="none"
        className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full"
        style={{ backgroundColor: 'rgba(90, 77, 190, 0.08)' }}
      />

      <View className="px-5 pt-5">
        <View className="flex-row items-start">
          <View className="min-w-0 flex-1 pr-1" style={{ zIndex: 2 }}>
            <View className="mb-3 flex-row flex-wrap items-center gap-2">
              <View
                className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ backgroundColor: colors.surface }}>
                <Text className="text-xs">✨</Text>
                <Text
                  className="text-[11px] font-extrabold uppercase tracking-[1.1px]"
                  style={{ color: colors.secondary }}>
                  AI Tutor
                </Text>
              </View>
              {resumable ? (
                <View
                  className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                  style={{ backgroundColor: `${colors.secondary}18` }}>
                  <View
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: colors.success }}
                  />
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: colors.secondary }}>
                    In progress
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              className="text-[26px] font-extrabold leading-8"
              style={{ color: colors.onTertiaryFixed }}>
              {title}
            </Text>
            <Text
              className="mt-2 text-[14px] leading-[21px]"
              style={{ color: colors.onTertiaryFixedVariant, maxWidth: 210 }}>
              {subtitle}
            </Text>
          </View>

          <View
            className="items-center justify-end"
            style={{ width: 124, marginTop: 2, marginRight: -4 }}>
            <Image
              source={tutorHeroArt}
              accessibilityLabel="AI tutor illustration"
              resizeMode="contain"
              style={{ width: 120, height: 112 }}
            />
          </View>
        </View>
      </View>

      <View className={`px-5 pb-5 pt-4 ${resumable ? 'gap-2.5' : ''}`}>
        {resumable ? (
          <PressableScale onPress={onResume} disabled={loading}>
            <View
              className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-full px-5"
              style={[{ backgroundColor: colors.navDark }, softShadow(2)]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-base">💬</Text>
                  <Text className="text-base font-extrabold text-white">
                    Resume Chat
                  </Text>
                  <Text className="text-base font-bold text-white">→</Text>
                </>
              )}
            </View>
          </PressableScale>
        ) : null}

        <PressableScale onPress={onStartNew} disabled={loading}>
          <View
            className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-full px-5"
            style={[
              {
                backgroundColor: resumable ? colors.surface : colors.navDark,
                borderWidth: resumable ? 1.5 : 0,
                borderColor: colors.border,
              },
              !resumable ? softShadow(2) : undefined,
            ]}>
            {loading && !resumable ? (
              <ActivityIndicator color={resumable ? colors.primary : '#fff'} />
            ) : (
              <>
                <Text
                  className="text-base font-bold"
                  style={{ color: resumable ? colors.ink : '#fff' }}>
                  {resumable ? '+' : '✨'}
                </Text>
                <Text
                  className="text-base font-extrabold"
                  style={{ color: resumable ? colors.ink : '#fff' }}>
                  {resumable ? 'New Chat' : 'Start Learning'}
                </Text>
              </>
            )}
          </View>
        </PressableScale>
      </View>
    </View>
  );
}
