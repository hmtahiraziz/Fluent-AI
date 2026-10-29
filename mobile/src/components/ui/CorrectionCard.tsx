import React from 'react';
import { Text, View } from 'react-native';
import type { MessageCorrection } from '../../api/types';
import { Button } from '../Button';
import { PressableScale } from './PressableScale';
import { colors } from '../../theme/tokens';

type Props = {
  correction: MessageCorrection;
  onSave?: () => void;
  onPractice?: () => void;
  saving?: boolean;
};

export function CorrectionCard({ correction, onSave, onPractice, saving }: Props) {
  const alternative = correction.naturalAlternative?.trim();

  return (
    <View
      className="mt-2 w-full rounded-[20px] p-4"
      style={{ backgroundColor: colors.insight }}>
      <View className="mb-2.5 flex-row items-center gap-2">
        <Text className="text-sm">🔧</Text>
        <Text
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: colors.tertiary }}>
          Grammar Correction
        </Text>
      </View>

      <Text className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
        Explanation
      </Text>
      <Text className="mt-1 text-sm leading-5" style={{ color: colors.tertiary }}>
        {correction.explanation}
      </Text>

      <View
        className="mt-3 rounded-2xl px-3.5 py-3"
        style={{ backgroundColor: colors.surface }}>
        <Text className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
          Original
        </Text>
        <Text className="mt-1 text-sm line-through" style={{ color: colors.inkMuted }}>
          {correction.original}
        </Text>
        <Text className="mt-3 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
          Corrected
        </Text>
        <Text className="mt-1 text-base font-bold text-brand">
          {correction.corrected}
        </Text>
        {alternative ? (
          <>
            <Text className="mt-3 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Natural alternative
            </Text>
            <Text className="mt-1 text-base font-semibold text-ink">
              {alternative}
            </Text>
          </>
        ) : null}
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {onSave ? (
          <Button
            title={saving ? 'Saving…' : 'Save vocabulary'}
            variant="lavender"
            loading={saving}
            className="min-w-[140px] flex-1"
            onPress={onSave}
          />
        ) : null}
        {onPractice ? (
          <PressableScale onPress={onPractice} className="min-w-[140px] flex-1">
            <View
              className="min-h-[52px] items-center justify-center rounded-full"
              style={{ backgroundColor: colors.surfaceContainer }}>
              <Text className="font-bold text-ink">Practice again</Text>
            </View>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}
