import React from 'react';
import { Text, View } from 'react-native';
import type { Conversation } from '../../../api/types';
import { languageMeta } from '../../../config/constants';
import { PressableScale } from '../../../components/ui/PressableScale';
import { colors } from '../../../theme/tokens';

type RecentConversationsProps = {
  conversations: Conversation[];
  currentTarget: string;
  onOpen: (conversation: Conversation) => void;
};

export function RecentConversations({
  conversations,
  currentTarget,
  onOpen,
}: RecentConversationsProps) {
  if (conversations.length === 0) return null;

  return (
    <View className="mb-6">
      <Text className="mb-3 px-0.5 text-lg font-bold text-ink">Recent Chats</Text>
      <View className="gap-2">
        {conversations.slice(0, 5).map(conversation => {
          const lang = languageMeta(conversation.language);
          const isCurrent = conversation.language === currentTarget;
          const title = conversation.title ?? 'Practice session';

          return (
            <PressableScale key={conversation.id} onPress={() => onOpen(conversation)}>
              <View
                className="flex-row items-center justify-between rounded-[16px] px-4 py-3.5"
                style={{
                  backgroundColor: isCurrent
                    ? colors.surfaceContainer
                    : colors.surfaceContainerLow,
                }}>
                <View className="min-w-0 flex-1 pr-3">
                  <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                    {title}
                  </Text>
                  <Text className="mt-0.5 text-xs text-ink-muted">
                    {lang.flag} {lang.label} • {conversation.level}
                  </Text>
                </View>
                {!isCurrent ? (
                  <View
                    className="rounded-full px-2.5 py-1"
                    style={{ backgroundColor: colors.surfaceContainerHighest }}>
                    <Text className="text-[10px] font-bold uppercase text-ink-muted">
                      Other
                    </Text>
                  </View>
                ) : (
                  <Text className="text-lg text-ink-faint">›</Text>
                )}
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
