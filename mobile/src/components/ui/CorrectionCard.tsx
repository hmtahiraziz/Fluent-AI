import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { MessageCorrection } from '../../api/types';
import { Button } from '../Button';
import { PressableScale } from './PressableScale';
import { colors } from '../../theme/tokens';
import { softShadow } from '../../theme/glass';

type Props = {
  correction: MessageCorrection;
  onSave?: () => void;
  onPractice?: () => void;
  saving?: boolean;
};

export function CorrectionCard({ correction, onSave, onPractice, saving }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View
      className="mt-2 overflow-hidden rounded-2xl border border-brand/20 bg-surface"
      style={softShadow(4)}>
      <Pressable
        onPress={() => setExpanded(v => !v)}
        className="flex-row items-center justify-between px-4 py-3"
        style={{ backgroundColor: colors.lavenderMuted }}>
        <Text className="text-sm font-bold text-brand">✨ Grammar correction</Text>
        <Text className="text-sm text-ink-muted">{expanded ? '▾' : '▸'}</Text>
      </Pressable>
      {expanded ? (
        <View className="gap-3 p-4">
          <View>
            <Text className="text-xs font-semibold uppercase text-ink-faint">Original</Text>
            <Text className="mt-1 text-sm text-ink-muted line-through">{correction.original}</Text>
          </View>
          <View>
            <Text className="text-xs font-semibold uppercase text-ink-faint">Corrected</Text>
            <Text className="mt-1 text-base font-bold text-brand">{correction.corrected}</Text>
          </View>
          <View>
            <Text className="text-xs font-semibold uppercase text-ink-faint">Explanation</Text>
            <Text className="mt-1 text-sm leading-6 text-ink-muted">{correction.explanation}</Text>
          </View>
          <View className="rounded-xl bg-brand/8 px-3 py-2">
            <Text className="text-xs font-semibold text-brand">Grammar tip</Text>
            <Text className="mt-1 text-sm text-ink-muted">
              Compare the original and corrected forms — notice word order and verb usage.
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
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
                <View className="items-center rounded-[28px] border border-border py-3.5">
                  <Text className="font-bold text-ink">Practice again</Text>
                </View>
              </PressableScale>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
