import React from 'react';
import { Text, View } from 'react-native';
import type { Message } from '../../api/types';
import { colors } from '../../theme/tokens';
import { softShadow } from '../../theme/glass';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

type ChatBubbleProps = {
  message: Message;
  showAvatar?: boolean;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const time = formatTime(message.createdAt);

  return (
    <View className={`max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
      <View
        className="rounded-2xl px-4 py-3"
        style={[
          softShadow(),
          {
            backgroundColor: isUser ? colors.primaryContainer : colors.surface,
            borderTopLeftRadius: isUser ? 16 : 4,
            borderTopRightRadius: isUser ? 4 : 16,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            borderWidth: isUser ? 0 : 1,
            borderColor: colors.surfaceContainer,
          },
        ]}>
        <Text
          className="text-base leading-6"
          style={{ color: isUser ? colors.onPrimaryContainer : colors.ink }}>
          {message.content}
        </Text>
      </View>
      {time ? (
        <Text className="mt-1 px-1 text-xs text-ink-muted">{time}</Text>
      ) : null}
    </View>
  );
}

export function ChatDatePill({ label = 'Today' }: { label?: string }) {
  return (
    <View className="mb-6 items-center">
      <View
        className="rounded-full px-4 py-1"
        style={{ backgroundColor: colors.surfaceContainer }}>
        <Text className="text-xs font-medium text-ink-muted">{label}</Text>
      </View>
    </View>
  );
}
