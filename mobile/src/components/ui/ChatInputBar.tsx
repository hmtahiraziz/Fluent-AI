import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHAT_QUICK_REPLIES } from '../../constants/chatPrompts';
import { colors } from '../../theme/tokens';
import { buttonShadow, softShadow } from '../../theme/glass';
import { PressableScale } from './PressableScale';

type ChatInputBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  sending?: boolean;
  maxWidth?: number;
  horizontalPad?: number;
  quickReplies?: readonly string[];
  onQuickReply?: (text: string) => void;
  showQuickReplies?: boolean;
};

export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  sending,
  maxWidth,
  horizontalPad = 16,
  quickReplies = CHAT_QUICK_REPLIES,
  onQuickReply,
  showQuickReplies = true,
}: ChatInputBarProps) {
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);
  const canSend = Boolean(value.trim()) && !sending;

  return (
    <View
      className="bg-canvas pt-3"
      style={{
        paddingHorizontal: horizontalPad,
        paddingBottom: Math.max(insets.bottom, 12),
      }}>
      <View className="mx-auto w-full gap-3" style={{ maxWidth }}>
        {showQuickReplies && quickReplies.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
            {quickReplies.map(reply => (
              <PressableScale key={reply} onPress={() => onQuickReply?.(reply)}>
                <View
                  className="rounded-full px-4 py-2"
                  style={{ backgroundColor: colors.surfaceContainer }}>
                  <Text className="text-sm font-bold text-ink-muted">{reply}</Text>
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        ) : null}

        <View className="flex-row items-center gap-2">
          <View
            className="min-h-[52px] flex-1 flex-row items-center rounded-full border px-4"
            style={[
              softShadow(4),
              {
                backgroundColor: colors.surface,
                borderColor: focused ? colors.primary : colors.border,
              },
            ]}>
            <TextInput
              className="max-h-32 min-h-[44px] flex-1 py-2 text-base leading-6 text-ink"
              placeholder="Type a message..."
              placeholderTextColor={colors.inkFaint}
              value={value}
              onChangeText={onChangeText}
              multiline
              editable={!sending}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <Text className="text-lg text-ink-faint">🎤</Text>
          </View>
          <Pressable
            onPress={() => canSend && onSend()}
            disabled={!canSend}
            className="h-[52px] w-[52px] items-center justify-center rounded-full"
            style={[
              { backgroundColor: canSend ? colors.primary : colors.border },
              buttonShadow(),
            ]}>
            <Text className="text-lg font-bold text-white">{sending ? '…' : '↑'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
