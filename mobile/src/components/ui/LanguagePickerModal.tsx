import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LanguageMeta } from '../../config/constants';
import { LanguageOptionCard } from './LanguageOptionCard';
import { colors } from '../../theme/tokens';

type LanguagePickerModalProps = {
  visible: boolean;
  title?: string;
  languages: readonly LanguageMeta[];
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
};

export function LanguagePickerModal({
  visible,
  title = 'Choose language',
  languages,
  selectedCode,
  onSelect,
  onClose,
}: LanguagePickerModalProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter(
      l =>
        l.label.toLowerCase().includes(q) ||
        l.nativeLabel.toLowerCase().includes(q) ||
        l.code.includes(q),
    );
  }, [languages, query]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-ink/40">
        <View
          className="max-h-[92%] rounded-t-[32px] bg-canvas px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="mb-4 items-center">
            <View
              className="mb-4 h-1 w-10 rounded-full"
              style={{ backgroundColor: colors.border }}
            />
            <View className="w-full flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-2xl font-bold text-ink">{title}</Text>
                <Text className="mt-1 text-sm text-ink-muted">
                  {filtered.length} language{filtered.length === 1 ? '' : 's'} available
                </Text>
              </View>
              <Pressable onPress={onClose} className="px-2 py-1">
                <Text className="text-base font-bold text-brand">Done</Text>
              </Pressable>
            </View>
          </View>

          <View className="relative mb-4">
            <Text
              className="absolute left-4 top-[14px] z-10 text-lg"
              style={{ color: colors.inkMuted }}>
              🔍
            </Text>
            <TextInput
              className="h-[52px] rounded-full border pl-12 pr-5 text-base text-ink"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
              placeholder="Search languages…"
              placeholderTextColor={colors.inkMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <View className="items-center py-12">
                <Text className="text-4xl">🌐</Text>
                <Text className="mt-3 text-base font-medium text-ink">
                  No languages found
                </Text>
                <Text className="mt-1 text-center text-sm text-ink-muted">
                  Try a different search term
                </Text>
              </View>
            ) : (
              filtered.map(lang => (
                <LanguageOptionCard
                  key={lang.code}
                  label={lang.label}
                  nativeLabel={lang.nativeLabel}
                  flag={lang.flag}
                  embedded
                  selected={selectedCode === lang.code}
                  onPress={() => {
                    onSelect(lang.code);
                    onClose();
                  }}
                />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
