import React from 'react';
import { Text, View } from 'react-native';
import type { Message } from '../../api/types';
import { TutorAvatar } from '../brand/TutorAvatar';
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

export function ChatBubble({ message, showAvatar = true }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const time = formatTime(message.createdAt);

  return (
    <View className={`mb-4 max-w-[90%] ${isUser ? 'self-end' : 'self-start'}`}>
      {!isUser && showAvatar ? (
        <View className="mb-2 flex-row items-center gap-2">
          <TutorAvatar size="sm" />
          <Text className="text-xs font-semibold text-ink-muted">FluentAI Tutor</Text>
          {time ? <Text className="text-xs text-ink-faint">{time}</Text> : null}
        </View>
      ) : null}
      {isUser && time ? (
        <Text className="mb-1 self-end text-xs text-ink-faint">{time}</Text>
      ) : null}
      <View
        className={`rounded-3xl px-4 py-3 ${
          isUser ? 'rounded-br-lg bg-brand' : 'rounded-bl-lg bg-surface border border-border'
        }`}
        style={!isUser ? softShadow(3) : undefined}>
        <Text
          className={`text-base leading-7 ${isUser ? 'font-medium text-white' : 'text-ink'}`}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}
