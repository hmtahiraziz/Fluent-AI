import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../../api/endpoints';
import type { Conversation } from '../../api/types';
import { getErrorMessage } from '../../api/client';
import { PENDING_CHAT_PROMPT_KEY } from '../../config/constants';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';

export function useChatLauncher() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { refreshSettings } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const startNewChat = useCallback(
    async (initialPrompt?: string) => {
      setCreating(true);
      setError('');
      try {
        await refreshSettings();
        const c = await api.createConversation(
          initialPrompt ? initialPrompt.slice(0, 80) : undefined,
        );
        if (initialPrompt) {
          await AsyncStorage.setItem(
            PENDING_CHAT_PROMPT_KEY,
            JSON.stringify({ conversationId: c.id, prompt: initialPrompt }),
          );
        }
        navigation.navigate('Chat', {
          conversationId: c.id,
          title: c.title ?? 'Practice',
          language: c.language,
          level: c.level,
          guided: Boolean(initialPrompt),
        });
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setCreating(false);
      }
    },
    [navigation, refreshSettings],
  );

  const resumeConversation = useCallback(
    (conversation: Conversation) => {
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        title: conversation.title ?? 'Practice',
        language: conversation.language,
        level: conversation.level,
      });
    },
    [navigation],
  );

  return { startNewChat, resumeConversation, creating, error, setError };
}
