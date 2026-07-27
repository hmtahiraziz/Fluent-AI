import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { MessageCorrection } from '../api/types';

type Props = {
  correction: MessageCorrection;
  onSave?: () => void;
  saving?: boolean;
};

export function CorrectionCard({ correction, onSave, saving }: Props) {
  return (
    <View className="mt-2 overflow-hidden rounded-xl border border-brand/25 bg-surface">
      <View className="bg-brand/10 px-3 py-2">
        <Text className="text-xs font-bold text-brand">Suggestion</Text>
      </View>
      <View className="gap-2 px-3 py-3">
        <Text className="text-sm text-ink-muted line-through">
          {correction.original}
        </Text>
        <Text className="text-base font-bold text-brand">{correction.corrected}</Text>
        <Text className="text-sm leading-5 text-ink-muted">
          {correction.explanation}
        </Text>
        {onSave ? (
          <Pressable
            onPress={onSave}
            disabled={saving}
            className="mt-1 self-start rounded-lg border border-accent bg-accent/10 px-4 py-2 active:opacity-80">
            <Text className="text-sm font-semibold text-accent-dark">
              {saving ? 'Saving…' : '+ Save phrase'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
