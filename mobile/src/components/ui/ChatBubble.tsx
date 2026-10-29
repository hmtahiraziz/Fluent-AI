import React from 'react';
import { Text, View } from 'react-native';
import type { Message } from '../../api/types';
import { colors } from '../../theme/tokens';

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
        className="px-4 py-3"
        style={{
          backgroundColor: isUser ? colors.primarySoft : colors.surfaceContainer,
          borderTopLeftRadius: isUser ? 18 : 6,
          borderTopRightRadius: isUser ? 6 : 18,
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
        }}>
        <Text
          className="text-base leading-6"
          style={{ color: isUser ? colors.primaryDark : colors.ink }}>
          {message.content}
        </Text>
      </View>
      {time ? (
        <Text className="mt-1.5 px-1 text-[11px] font-medium text-ink-faint">{time}</Text>
      ) : null}
    </View>
  );
}

export function ChatDatePill({ label = 'Today' }: { label?: string }) {
  return (
    <View className="mb-5 items-center">
      <View
        className="rounded-full px-3.5 py-1"
        style={{ backgroundColor: colors.surfaceContainer }}>
        <Text className="text-xs font-medium text-ink-muted">{label}</Text>
      </View>
    </View>
  );
}
