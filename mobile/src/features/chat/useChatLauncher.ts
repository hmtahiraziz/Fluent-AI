import { useCallback, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../../api/endpoints';
import type { Conversation } from '../../api/types';
import { getErrorMessage } from '../../api/client';
import { PENDING_CHAT_PROMPT_KEY } from '../../config/constants';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import {
  normalizePracticeContext,
  type PracticeSessionContext,
} from './practiceContext';

export function useChatLauncher() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { refreshSettings } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const inFlightRef = useRef(false);

  const startNewChat = useCallback(
    async (ctx?: PracticeSessionContext | string) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setCreating(true);
      setError('');

      try {
        await refreshSettings();

        const normalized =
          typeof ctx === 'string'
            ? normalizePracticeContext({
                initialPrompt: ctx,
                source: 'home_new',
              })
            : normalizePracticeContext(ctx);

        const initialPrompt = normalized?.initialPrompt;
        const titleSeed = initialPrompt?.slice(0, 80) || normalized?.scenario?.slice(0, 80);

        const c = await api.createConversation({
          title: titleSeed,
          topic: normalized?.topic,
          scenario: normalized?.scenario,
        });

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
        inFlightRef.current = false;
        setCreating(false);
      }
    },
    [navigation, refreshSettings],
  );

  const resumeConversation = useCallback(
    (conversation: Conversation) => {
      if (inFlightRef.current) return;
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
