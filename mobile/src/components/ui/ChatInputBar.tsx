import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { languageMeta } from '../../config/constants';

type ChatInputBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  sending?: boolean;
  languageCode?: string;
  maxWidth?: number;
  horizontalPad?: number;
};

export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  sending,
  languageCode = 'es',
  maxWidth,
  horizontalPad = 16,
}: ChatInputBarProps) {
  const insets = useSafeAreaInsets();
  const lang = languageMeta(languageCode);
  const canSend = Boolean(value.trim()) && !sending;
  const scale = useSharedValue(1);

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <View
        className="border-t border-border/40 bg-surface/95 px-4 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 12), paddingHorizontal: horizontalPad }}>
        <View
          className="mx-auto w-full"
          style={{ maxWidth }}>
          <View className="mb-2 flex-row items-center justify-between px-1">
            <Text className="text-xs font-medium text-ink-muted">
              {lang.flag} Practicing {lang.label}
            </Text>
            <Text className="text-xs text-ink-faint">🎤 Voice · 📎 Attach (soon)</Text>
          </View>
          <View className="flex-row items-end gap-2 rounded-3xl border border-border bg-surface px-3 py-2">
            <TextInput
              className="max-h-32 min-h-[44px] flex-1 py-2 text-base leading-6 text-ink"
              placeholder="Message FluentAI…"
              placeholderTextColor={colors.inkFaint}
              value={value}
              onChangeText={onChangeText}
              multiline
              editable={!sending}
            />
            <Animated.View style={sendStyle}>
              <Pressable
                onPress={() => {
                  if (!canSend) return;
                  scale.value = withSpring(0.9, {}, () => {
                    scale.value = withSpring(1);
                  });
                  onSend();
                }}
                disabled={!canSend}
                className="mb-0.5 h-11 w-11 items-center justify-center rounded-full"
                style={{
                  backgroundColor: canSend ? colors.primary : colors.border,
                }}>
                {sending ? (
                  <Text className="text-white">…</Text>
                ) : (
                  <Text className="text-lg font-bold text-white">↑</Text>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
