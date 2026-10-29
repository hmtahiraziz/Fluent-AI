import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHAT_QUICK_REPLIES } from '../../constants/chatPrompts';
import { bottomChromePadding } from '../../theme/safeArea';
import { colors } from '../../theme/tokens';
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
  /** RTL for Arabic/Urdu quick replies and composer text. */
  rtl?: boolean;
  /**
   * When provided by ChatScreen (via useKeyboardInset), use it so padding
   * stays in sync with KeyboardStickyView. Do not apply keyboard height here.
   */
  keyboardVisible?: boolean;
};

/**
 * Visual composer only. Keyboard lift is owned by parent KeyboardStickyView.
 * Bottom padding: safe-area when closed; compact pad when open (no nav inset).
 */
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
  rtl = false,
  keyboardVisible,
}: ChatInputBarProps) {
  const insets = useSafeAreaInsets();
  const controllerVisible = useKeyboardState(state => state.isVisible);
  const [focused, setFocused] = useState(false);
  const canSend = Boolean(value.trim()) && !sending;
  const isKeyboardOpen = keyboardVisible ?? controllerVisible;

  // Closed: clear system nav / home indicator. Open: sticky view already sits
  // on the keyboard — only keep a small visual gap (do not re-add insets.bottom).
  const bottomPad = bottomChromePadding(insets.bottom, {
    keyboardOpen: isKeyboardOpen,
  });

  return (
    <View
      className="bg-canvas pt-3"
      style={{
        paddingHorizontal: horizontalPad,
        paddingBottom: bottomPad,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
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
                  <Text
                    className="text-sm font-semibold text-ink-muted"
                    style={{ writingDirection: rtl ? 'rtl' : 'ltr' }}>
                    {reply}
                  </Text>
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        ) : null}

        <View className="flex-row items-end gap-2.5">
          <View
            className="min-h-[52px] flex-1 justify-center rounded-[16px] px-4"
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderWidth: 1.5,
              borderColor: focused ? colors.primary : 'transparent',
            }}>
            <TextInput
              className="max-h-28 min-h-[44px] w-full py-2.5 text-base leading-6 text-ink"
              style={{
                writingDirection: rtl ? 'rtl' : 'ltr',
                textAlign: rtl ? 'right' : 'left',
              }}
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
              underlineColorAndroid="transparent"
            />
          </View>
          <Pressable
            onPress={() => canSend && onSend()}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend }}
            className="h-[52px] w-[52px] items-center justify-center rounded-full"
            style={{
              backgroundColor: canSend ? colors.primary : colors.surfaceContainerHighest,
              opacity: sending ? 0.7 : 1,
            }}>
            <Text
              className="text-lg font-bold"
              style={{ color: canSend ? '#fff' : colors.inkFaint }}>
              {sending ? '…' : '↑'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
