import React, { useMemo, useState } from 'react';
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
import { SelectionRow } from './SelectionRow';

type LanguagePickerModalProps = {
  visible: boolean;
  languages: readonly LanguageMeta[];
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
};

export function LanguagePickerModal({
  visible,
  languages,
  selectedCode,
  onSelect,
  onClose,
}: LanguagePickerModalProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

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
          className="max-h-[85%] rounded-t-[32px] bg-surface px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-ink">Choose language</Text>
            <Pressable onPress={onClose} className="px-2 py-1">
              <Text className="text-base font-bold text-brand">Done</Text>
            </Pressable>
          </View>
          <TextInput
            className="mb-4 rounded-2xl border border-border bg-mist px-4 py-3 text-base text-ink"
            placeholder="Search languages…"
            value={query}
            onChangeText={setQuery}
          />
          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.map(lang => (
              <SelectionRow
                key={lang.code}
                title={lang.label}
                subtitle={lang.nativeLabel}
                leading={<Text className="text-2xl">{lang.flag}</Text>}
                selected={selectedCode === lang.code}
                onPress={() => {
                  onSelect(lang.code);
                  onClose();
                }}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
