import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHAT_QUICK_REPLIES } from '../../constants/chatPrompts';
import { colors } from '../../theme/tokens';
import { buttonShadow } from '../../theme/glass';
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
  keyboardVisible?: boolean;
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
  keyboardVisible = false,
}: ChatInputBarProps) {
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);
  const canSend = Boolean(value.trim()) && !sending;

  const bottomPad = keyboardVisible ? 10 : Math.max(insets.bottom, 16);

  return (
    <View
      className="bg-canvas pt-4"
      style={{
        paddingHorizontal: horizontalPad,
        paddingBottom: bottomPad,
      }}>
      <View className="mx-auto w-full gap-4" style={{ maxWidth }}>
        {showQuickReplies && quickReplies.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
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

        <View className="flex-row items-end gap-2">
          <View
            className="min-h-[52px] flex-1 justify-center rounded-full border px-4"
            style={{
              backgroundColor: colors.surface,
              borderColor: focused ? colors.primary : colors.border,
              borderWidth: focused ? 2 : 1,
            }}>
            <TextInput
              className="max-h-28 min-h-[44px] w-full py-2.5 text-base leading-6 text-ink"
              placeholder="Type a message..."
              placeholderTextColor={colors.inkFaint}
              value={value}
              onChangeText={onChangeText}
              multiline
              editable={!sending}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="send"
              blurOnSubmit={Platform.OS === 'ios'}
              onSubmitEditing={() => canSend && onSend()}
            />
          </View>
          <Pressable
            onPress={() => canSend && onSend()}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            className="h-[52px] w-[52px] items-center justify-center rounded-full"
            style={[
              { backgroundColor: canSend ? colors.primary : colors.border },
              canSend ? buttonShadow() : undefined,
            ]}>
            <Text className="text-lg font-bold text-white">{sending ? '…' : '↑'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
