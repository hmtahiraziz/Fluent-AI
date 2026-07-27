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
  return (
    <View
      className="mt-2 w-full rounded-card p-5"
      style={{
        backgroundColor: colors.insight,
        borderWidth: 1,
        borderColor: colors.insightBorder,
      }}>
      <View className="mb-3 flex-row items-center gap-2">
        <Text className="text-base">🔧</Text>
        <Text
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: colors.tertiary }}>
          Grammar Correction
        </Text>
      </View>
      <Text className="text-base leading-6" style={{ color: colors.tertiary }}>
        {correction.explanation}
      </Text>
      <View
        className="mt-3 rounded-xl border p-3"
        style={{
          backgroundColor: 'rgba(255,255,255,0.4)',
          borderColor: colors.insightBorder,
        }}>
        <Text className="text-base italic" style={{ color: colors.tertiary }}>
          "{correction.corrected}"
        </Text>
      </View>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {onSave ? (
          <Button
            title={saving ? 'Saving…' : 'Save vocabulary'}
            variant="lavender"
            loading={saving}
            className="flex-1 min-w-[140px]"
            onPress={onSave}
          />
        ) : null}
        {onPractice ? (
          <PressableScale onPress={onPractice} className="flex-1 min-w-[140px]">
            <View className="min-h-[52px] items-center justify-center rounded-full border border-border">
              <Text className="font-bold text-ink">Practice again</Text>
            </View>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}
