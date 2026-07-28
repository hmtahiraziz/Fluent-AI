import React from 'react';
import { Text, View } from 'react-native';
import type { Conversation } from '../../../api/types';
import { TutorAvatar } from '../../../components/brand/TutorAvatar';
import { Button } from '../../../components/Button';
import { colors } from '../../../theme/tokens';
import { LanguagePairPill } from './LanguagePairPill';
import type { LanguagePairInfo } from '../useLanguagePair';

type PracticeChatHeroProps = {
  languagePair: LanguagePairInfo;
  resumable: Conversation | null;
  onStartNew: () => void;
  onResume: () => void;
  loading?: boolean;
};

export function PracticeChatHero({
  languagePair,
  resumable,
  onStartNew,
  onResume,
  loading = false,
}: PracticeChatHeroProps) {
  const { native, target, level, target: targetMeta } = languagePair;

  const title = resumable ? 'Continue Practice' : 'Start Practice';
  const subtitle = resumable
    ? resumable.title
      ? `Pick up "${resumable.title}" in ${targetMeta.label}.`
      : `Continue your ${targetMeta.label} conversation at ${level}.`
    : `Ready to practice ${targetMeta.label} at ${level} level?`;

  return (
    <View
      className="mb-6 overflow-hidden rounded-[24px] p-6"
      style={{ backgroundColor: colors.insight }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="mb-2 flex-row items-center gap-2">
            <Text className="text-base">✨</Text>
            <Text
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: colors.tertiary }}>
              AI Tutor
            </Text>
          </View>
          <LanguagePairPill native={native} target={target} level={level} />
          <Text
            className="mt-3 text-[28px] font-bold leading-9"
            style={{ color: '#1f1c0a' }}>
            {title}
          </Text>
          <Text className="mt-2 max-w-[220px] text-base leading-6 text-tertiary">
            {subtitle}
          </Text>
        </View>
        <View className="h-24 w-24 items-center justify-center">
          <TutorAvatar size="md" />
        </View>
      </View>

      <View className={`mt-6 ${resumable ? 'gap-3' : ''}`}>
        {resumable ? (
          <Button title="Resume Chat" variant="dark" loading={loading} onPress={onResume} />
        ) : null}
        <Button
          title={resumable ? 'New Chat' : 'Start New Chat'}
          variant={resumable ? 'outline' : 'dark'}
          loading={loading}
          onPress={onStartNew}
        />
      </View>
    </View>
  );
}
